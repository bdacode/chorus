describe("chorus.views.HdfsDirectoryEntryList", function() {
    beforeEach(function() {
        this.collection = fixtures.hdfsDirectoryEntrySet(null, {instanceId: "1234", path: "abc"});
        this.view = new chorus.views.HdfsDirectoryEntryList({ collection : this.collection});
    });
    describe("#render", function() {
        beforeEach(function() {
            spyOn(chorus.PageEvents, "broadcast");
            this.view.render();
        });

        it("should render li for each item", function() {
            expect(this.view.$("li").length).toBe(this.collection.length);
        });

        it("renders the name for each item", function() {
            expect(this.view.$("li:eq(0) .name")).toContainText(this.collection.at(0).get("name"));
            expect(this.view.$("li:eq(1) .name")).toContainText(this.collection.at(1).get("name"));
        })

        it("renders the type for each item", function() {
            expect(this.view.$("li:eq(0) .size")).toContainText(I18n.toHumanSize(this.collection.at(0).get("size")));
            expect(this.view.$("li:eq(1) .size")).toContainText(I18n.toHumanSize(this.collection.at(1).get("size")));
        });

        it("renders the icon for each item", function() {
            expect(this.view.$("li:eq(0) img")).toExist();
            expect(this.view.$("li:eq(1) img")).toExist();
        })

        it("pre-selects the first item", function() {
            expect(this.view.$("li:eq(0)")).toHaveClass("selected");
            expect(chorus.PageEvents.broadcast).toHaveBeenCalledWith("hdfs_entry:selected", this.collection.at(0));
        })

        describe("clicking on an li", function() {
            beforeEach(function() {
                this.view.$("li:eq(1)").click();
            });

            it("broadcasts hdfs_entry:selected", function() {
                expect(chorus.PageEvents.broadcast).toHaveBeenCalledWith("hdfs_entry:selected", this.collection.at(1));
            })

            it("adds the selected class to only that item", function() {
                expect(this.view.$("li:eq(1)")).toHaveClass("selected");
                expect(this.view.$("li:eq(0)")).not.toHaveClass("selected");
            })
        })
    });
});