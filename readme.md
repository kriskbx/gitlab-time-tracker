# gitlab-time-tracker

> A command line interface that makes working with GitLabs time tracking feature more enjoyable.

![preview](https://raw.githubusercontent.com/kriskbx/gitlab-time-tracker/master/preview.gif)

### requirements

### installation

### commands

#### edit configuration

Edit the global configuration file. [Available options](#options)

```
# edit/create the global configuration file, stored in your home directory
gtt edit

# edit/create a local configuration file in the current directory
# if a local configuration file is present, it is used instead of
# the global one
gtt edit --local
```

#### reports

Get a report for your project or issue.

```
# available report commands
gtt report ["namespace/project"] [issue_id]
gtt report:month ["2017-03"] ["namespace/project"]
gtt report:day ["2017-03-01"] ["namespace/project"]

# timeframe
gtt report --from="2017-03-01" --to="2017-04-01"

# include closed issues
gtt report --closed=true

# limit to a user
gtt report --user=username

# limit to a milestone
gtt report --milestone=milestone_name

# overwrite the default date format or the date format stored in your config
gtt report --date_format="d.m.Y H:i:s"

# overwrite the default time format
gtt report --time_format="[%sign][%days>d ][%hours>h ][%minutes>m ][%seconds>s]"

# overwrite the default columns or the columns stored in your config
gtt report --columns=iid --columns=title --columns=estimation

# only include issues and merge requests that have the following labels, overwrites the includeByLabels store in your config
gtt report --include_by_labels=critical --include_by_labels=important

# exclude issues and merge requests that have the following labels, overwrites the excludeByLabels store in your config
gtt report --exclude_by_labels=wont-fix --exclude_by_labels=ignore

# only include the given labels in the results, overwrites the includeLabels stored in your config
gtt report --include_labels=pending --include_labels=approved

# exclude the given labels from the results, overwrites the excludeLabels stored in your config
gtt report --exclude_labels=bug --exclude_labels=feature

# choose a different output than a stdout table (json coming soon)
gtt report --output=markdown --file=filename.md
gtt report --output=csv --file=filename.csv
```

#### time tracking

> coming soon

### configuration options

Here's a sample configuration file including all available options:

```
# url to the gitlab api. make sure there's a trailing slash
url: http://gitlab.com/api/v4/

# your api token
token: abcdefghijklmnopqrst

# default project
project: namespace/projectname

# include closed by default
closed: true

# default milestone to filter issues by
milestone: milestone_name

# hours per day
hoursPerDay: 8

# columns to include in the report
# available columns: id, iid, title, project_id, description, labels, milestone,
# assignee, author, closed, updated_at, created_at, state, estimate, time_spent
columns:
- iid
- title
- estimation

# date format
dateFormat: Y-m-d H:i:s

# time format
#
# [%sign], [%days], [%hours], [%minutes], [%seconds] 
# -> prints out the raw data
#
# [%days>string], [%hours>string], [%minutes>string], [%seconds>string] 
# -> is a conditional and prints out the data and appends the given string
#    if the data is greater than zero
#
# [%Days], [%Hours], [%Minutes], ...
# -> uppercase adds leading zeros
#
# [%days_overall], [%hours_overall], [%minutes_overall], ...
# -> instead of printing out the second-/minute-/hour-/day-part of the time
#    this prints the complete time in seconds/minutes/hours/days
#
# [%days_overall_comma], [%hours_overall_comma], [%minutes_overall_comma] 
# -> use a comma instead of a dot for those float values
timeFormat: "[%sign][%days>d ][%hours>h ][%minutes>m ][%seconds>s]"

# default output
output: markdown

# exclude issues and merge requests that have the following labels
excludeByLabels:
- wont-fix
- ignore

# only include issues and merge request that have the following labels
includeByLabels:
- critical
- important

# exclude the following labels in the results
excludeLabels:
- bug
- feature

# only include the following labels in the result
includeLabels:
- pending
- approved
```

### faqs

#### It takes a long time to get Issues and process them

There's no API for querying time results, so I have to fetch all the comments and parse them for time spent. That process takes quite a while (2 additional requests for each Issue). I'm sorry, blame GitLab for implementing it that way.

#### GitLab will probably ship some of these features sooner or later

Yeah, I'm aware of that. For now (March 2017) GitLabs time tracking is a mess and this tool makes it way better.

#### This was a php project once?

Yeah, I decided to rewrite everything in node coz I wanted to improve my node and es6 skills.

#### why php? why not ruby/node/go/python/erlang?

Because I'm a PHP dev. And I like PHP. Actually PHP is not that bad. Shut up and get a life.

### license

GPL v2