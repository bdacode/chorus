require 'fileutils'
require 'timeout'

class CrossDatabaseTableCopier < TableCopier
  def run
    source_connection.connect!
    destination_connection.connect!
    source_connection.execute(source_dataset.query_setup_sql)

    source_count = get_count(source_connection, source_dataset.name)
    @initial_destination_count = destination_count
    count = [source_count, (sample_count || source_count)].min

    pipe_file = File.join(gpfdist_data_dir, pipe_name)
    if count > 0
      system "mkfifo #{pipe_file}"

      semaphore = java.util.concurrent.Semaphore.new(0)

      reader_finished = false
      writer_finished = false
      source_connection.execute create_write_pipe_sql

      destination_connection.execute create_read_pipe_sql

      reader = Thread.new { begin
        reader_loop(count)
      ensure
        reader_finished = true
        semaphore.release
      end }
      writer = Thread.new { begin
        write_data
      ensure
        writer_finished = true
        semaphore.release
      end }

      semaphore.acquire
      acquire_result = semaphore.tryAcquire(5000, java.util.concurrent.TimeUnit::MILLISECONDS)

      #see if we need to recover from any errors.
      if !reader_finished
        system "echo '' >> #{pipe_file}"
      elsif !writer_finished
        system "cat #{pipe_file} > /dev/null"
        raise Exception, "Contents could not be read."
      end

      reader.join
      writer.join
    end

  ensure
    FileUtils.rm pipe_file if pipe_file && File.exists?(pipe_file)
    source_connection.disconnect
    destination_connection.disconnect
  end

  def write_data
    source_connection.copy_table_data(%Q{"#{write_pipe_name}"}, source_dataset.name, '', sample_count)
  end

  def reader_loop(count)
    while (destination_count - @initial_destination_count) < count
      destination_connection.copy_table_data(destination_table_fullname, read_pipe_name, '')
    end
  end

  def write_pipe_name
    "#{pipe_name}_w"
  end

  def read_pipe_name
    "#{pipe_name}_r"
  end

  def gpfdist_url
    ChorusConfig.instance['gpfdist.url']
  end

  def gpfdist_protocol
    ChorusConfig.instance['gpfdist.ssl.enabled'] ? 'gpfdists' : 'gpfdist'
  end

  def pipe_name
    @pipe_name ||= "pipe_#{Process.pid}_#{Time.current.to_i}_#{@attributes[:pipe_name]}"
  end

  private

  def create_write_pipe_sql
    "CREATE WRITABLE EXTERNAL TEMPORARY TABLE #{write_pipe_name} (#{table_definition})
     LOCATION ('#{gpfdist_protocol}://#{gpfdist_url}:#{gpfdist_write_port}/#{pipe_name}') FORMAT 'TEXT'"
  end

  def create_read_pipe_sql
    "CREATE EXTERNAL TEMPORARY TABLE #{read_pipe_name} (#{table_definition})
     LOCATION ('#{gpfdist_protocol}://#{gpfdist_url}:#{gpfdist_read_port}/#{pipe_name}') FORMAT 'TEXT'"
  end

  def gpfdist_data_dir
    ChorusConfig.instance['gpfdist.data_dir']
  end

  def gpfdist_write_port
    ChorusConfig.instance['gpfdist.write_port']
  end

  def gpfdist_read_port
    ChorusConfig.instance['gpfdist.read_port']
  end

  def get_count(connection, table_name)
    connection.count_rows(table_name)
  end

  def destination_count
    get_count(destination_connection, destination_table_name)
  end
end
