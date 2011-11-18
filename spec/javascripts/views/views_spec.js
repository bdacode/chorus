describe("chorus.views", function() {
    describe("#context", function() {
        describe("for a view with a model", function() {
            beforeEach(function() {
                this.model = new chorus.models.Base({ bar: "foo"});
                this.view = new chorus.views.Base({ model : this.model });
            });

            it("serializes the attributes of the model", function() {
                expect(this.view.context()).toEqual({ bar: "foo" });
            })

            describe("loaded:true", function() {
                beforeEach(function() {
                    this.model.loaded = true;
                });

                it("returns loaded:true", function() {
                    expect(this.view.context().loaded).toBeTruthy();
                });
            });

            describe("loaded:false", function() {
                beforeEach(function() {
                    this.model.loaded = false;
                });

                it("returns loaded:false", function() {
                    expect(this.view.context().loaded).toBeFalsy();
                });
            });

            describe("when an additionalContext is defined", function() {
                beforeEach(function(){
                    this.view.additionalContext = function(){
                        return {one: 1};
                    };
                });

                it("still contains the attributes of the model", function(){
                    expect(this.view.context().bar).toBe("foo");
                });

                it("includes the additionalContext in the context", function() {
                    expect(this.view.context().one).toBe(1);
                });
            });
        });

        describe("when an additionalContext is defined", function() {
            beforeEach(function(){
                this.view = new chorus.views.Base();
                spyOn(this.view, "additionalContext").andCallFake(function(){
                    return {one: 1};
                });
            });

            it("includes the additionalContext in the context", function() {
                expect(this.view.context().one).toBe(1);
            });
        });

        describe("for a view with a collection", function () {
            beforeEach(function() {
                this.collection = new chorus.models.Collection([
                    new chorus.models.Base({ bar: "foo"}),
                    new chorus.models.Base({ bro: "baz"})
                ], { custom: "stuff" });
                this.view = new chorus.views.Base({ collection: this.collection });
            });

            it("serializes the attributes of the collection", function() {
                expect(this.view.context().custom).toBe("stuff");
            })

            it("serializes the attributes of the collection objects into the 'models' key", function() {
                var modelContext = this.view.context().models;
                expect(modelContext).not.toBeUndefined();
                expect(modelContext.length).toBe(2);
                expect(modelContext[0]).toEqual({ bar: "foo" });
                expect(modelContext[1]).toEqual({ bro: "baz" });
            })

            context("when a collectionModelContext is defined", function() {
                beforeEach(function() {
                    this.view.collectionModelContext = function(model) {
                        return {my_cid: model.cid}
                    };
                });

                it("includes the collectionModelContext in the context for each model", function() {
                    var context = this.view.context();
                    expect(context.models[0].my_cid).toBe(this.collection.models[0].cid);
                    expect(context.models[1].my_cid).toBe(this.collection.models[1].cid);
                });
            });

            describe("when an additionalContext is defined", function() {
                beforeEach(function(){
                    spyOn(this.view, "additionalContext").andCallFake(function(){
                        return {one: 1};
                    });
                });

                it("includes the additionalContext in the context", function() {
                    expect(this.view.context().one).toBe(1);
                });
            });

            describe("loaded:true", function() {
                beforeEach(function() {
                    this.collection.loaded = true;
                });

                it("returns loaded:true", function() {
                    expect(this.view.context().loaded).toBeTruthy();
                });
            });

            describe("loaded:false", function() {
                beforeEach(function() {
                    this.collection.loaded = false;
                });

                it("returns loaded:false", function() {
                    expect(this.view.context().loaded).toBeFalsy();
                });
            });
        })
    })

    describe("MainContentView", function() {
        beforeEach(function() {
            this.loadTemplate("main_content");
        });

        describe("#render", function() {
            beforeEach(function() {
                this.view = new chorus.views.MainContentView();

                this.view.contentHeader = stubView("header text");
                this.view.content = stubView("content text");

                this.view.render();
            });

            context("with a supplied contentHeader", function() {
                it("should render the header", function() {
                    expect(this.view.$("#content_header").text()).toBe("header text");
                });
            });

            context("with a supplied content", function() {
                it("should render the content", function() {
                    expect(this.view.$("#content").text()).toBe("content text");
                });
            });

            context("without a supplied contentDetails", function() {
                it("should have the hidden class on the content_details div", function() {
                    expect((this.view.$("#content_details"))).toHaveClass("hidden");
                });
            });

            context("with a supplied contentDetails", function() {
                beforeEach(function() {
                    this.view.contentDetails = stubView("content details text");
                    this.view.render();
                });

                it("should render the contentDetails", function() {
                    expect((this.view.$("#content_details").text())).toBe("content details text");
                });
            });
        });
    });

    describe("SubNavContentView", function() {
        beforeEach(function() {
            this.loadTemplate("sub_nav_content");
        });

        describe("#setup", function() {
            beforeEach(function() {
                spyOn(chorus.views, "SubNavHeader")
                this.model = new chorus.models.Workspace();
                this.view = new chorus.views.SubNavContentView({ modelClass : "Workspace", tab : "summary", model : this.model});
            })

            it("creates a SubNavHeader", function() {
                expect(chorus.views.SubNavHeader).toHaveBeenCalled();
            });
        })

        describe("#postRender", function() {
            beforeEach(function() {
                this.view = new chorus.views.SubNavContentView({ modelClass : "Workspace", tab : "summary" });

                this.view.header = stubView("header text");
                this.view.content = stubView("content text");
                this.view.contentDetails = stubView("content details text");

                spyOn(this.view.header, "delegateEvents");
                spyOn(this.view.content, "delegateEvents");
                spyOn(this.view.contentDetails, "delegateEvents");
                this.view.render();
            });

            it("should render the header", function() {
                expect(this.view.$("#sub_nav_header").text()).toBe("header text");
            });

            it("should render the content", function() {
                expect(this.view.$("#content").text()).toBe("content text");
            });

            context("without a supplied contentDetails", function() {
                beforeEach(function() {
                    this.view.contentDetails = undefined;
                    this.view.render();
                });

                it("should have the hidden class on the content_details div", function() {
                    expect((this.view.$("#content_details"))).toHaveClass("hidden");
                });
            });

            context("with a supplied contentDetails", function() {
                it("should render the contentDetails", function() {
                    expect((this.view.$("#content_details").text())).toBe("content details text");
                });
            });

            it("delegates events to the child views", function() {
                expect(this.view.header.delegateEvents).toHaveBeenCalled();
                expect(this.view.content.delegateEvents).toHaveBeenCalled();
                expect(this.view.contentDetails.delegateEvents).toHaveBeenCalled();
            })
        });
    });

    describe("SubNavContentList", function() {
        beforeEach(function() {
            this.loadTemplate("sub_nav_content");
            this.loadTemplate("count");
        });

        describe("#setup", function() {
            beforeEach(function() {
                spyOn(chorus.views, "WorkfileList");
                spyOn(chorus.views, "Count");

                this.collection = new chorus.models.WorkfileSet();
                this.view = new chorus.views.SubNavContentList({
                    modelClass : "Workfile",
                    tab : "workfiles",
                    collection : this.collection
                });
            });

            it("creates a list view for the collection", function() {
                expect(chorus.views.WorkfileList).toHaveBeenCalledWith({ collection : this.collection });
            })

            it("creates a count view", function() {
                expect(chorus.views.Count).toHaveBeenCalledWith({collection : this.collection, modelClass : "Workfile" });
            })

            it("sets the content view", function() {
                expect(this.view.content).toBeDefined();
            })

            it("sets the content detail view", function() {
                expect(this.view.contentDetails).toBeDefined();
            })
        });
    })
})
