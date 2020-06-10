# Contributing

## How to test the basic functions of gtt

Create a new project on GitLab if you haven't done so already and write down the project path. e.g. `kriskbx/example-project`. To test groups and subgroups, create a new group with at least one subgroup. Add a new project to both the parent group (e.g. `example-group`) and the subgroup (e.g. `example-group/example-subgroup`) and write down the paths of all the projects and groups. Create at least two issues (write down their id e.g. `42`, `43`) and one merge request (e.g. `13`) in all projects. Or just use our public group over here: https://gitlab.com/gtt

Then run the following basic commands and check that they work as expected:

```
# Test config command
gtt config

# Test basic time tracking
gtt start "kriskbx/example-project" 42
gtt stop
gtt log

# Test cancelling
gtt start "kriskbx/example-project" 42
gtt cancel
gtt log

# Test merge request
gtt start --type=merge_request "kriskbx/example-project" 13
gtt stop
gtt log

# Test issue creation
gtt create "krisbxkbx/example-project" "New Issue"
gtt stop
gtt log

# Test editing
gtt edit

# Test deletion
gtt start "kriskbx/example-project" 42
gtt stop
gtt delete

# Test sync, check out issues on GitLab if changes are synced correctly
gtt sync

# Test basic report
gtt report "kriskbx/example-project"

# Test report for a single issue and multiple issues
gtt report "kriskbx/example-project" 42
gtt report "kriskbx/example-project" 42 43

# Test report for a group
gtt report --type=group "example-group"
gtt report --type=group --subgroups "example-group"

# Test combined reports
gtt report "kriskbx/example-project" "example-group/example-project"

# Test outputs
gtt report --output=table "kriskbx/example-project"
gtt report --output=markdown "kriskbx/example-project"
gtt report --output=csv "kriskbx/example-project"
gtt report --output=pdf --file=test.pdf "kriskbx/example-project"
gtt report --output=xlsx --file=test.xlsx "kriskbx/example-project"

# Test timeframes (adjust the values so it includes/excludes your issues)
gtt report --from="2020-06-02" --to="2020-06-03" "kriskbx/example-project"

# Test filtering (you might need to add milestones, labels and additional stuff to properly test this)
gtt report --closed "kriskbx/example-project"
gtt report --user=username "kriskbx/example-project"
gtt report --milestone=milestone_name "kriskbx/example-project"
gtt report --include_by_labels=critical "kriskbx/example-project"
gtt report --exclude_by_labels=ignore "kriskbx/example-project"
gtt report --query=issues "kriskbx/example-project"
```
