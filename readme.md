# gtt

> A command line interface that makes working with GitLabs time tracking feature more enjoyable.

![preview](https://raw.githubusercontent.com/kriskbx/gitlab-time-tracker/master/preview.gif)

### upgrading from 0.*

I built gtt originally in PHP because I'm a PHP dev and I chose the language I'm most familiar 
with to create a quick and dirty prototype. After some consideration I rebuilt everything from 
scratch for nodejs. Follow these steps to upgrade:

```
# 1. remove the old version entirely
composer global remove kriskbx/gitlab-time-tracker

# 2. install the new version
yarn global add gitlab-time-tracker

# 3. edit your configuration and update the date format
# format options: http://momentjs.com/docs/#/displaying/format/
gtt edit

# 4. the columns option is now split into 3 options for different parts of
# the report: issueColumns, mergeRequestColumns and recordColumns
# there's also a userColumns option that adds a column for each user
# with total time spent. please update your config accordingly
```

### requirements

* nodejs version > 6

### installation

```
# using yarn
yarn global add gitlab-time-tracker --prefix /usr/local
```

### commands

#### edit configuration

Edit the configuration file. [Available options](#options)

```
# edit/create the global configuration file, stored in your home directory
gtt edit

# edit/create a local configuration file (.gtt.yml) in the current directory
# if a local configuration file is present, it is used instead of the global one.
# so you can use gtt on a per project basis. make sure to add .gtt.yml to your 
# gitignore file if using a local configuration
gtt edit --local
```

#### reports

Get a report for your project.

```
# available report commands
gtt report ["namespace/project"] [issue_id]

# timeframe
gtt report --from="2017-03-01" --to="2017-04-01"

# include closed issues/merge_requests
gtt report --closed=true

# limit to a user
gtt report --user=username

# limit to a milestone
gtt report --milestone=milestone_name

# query only one data type: issues, merge_requests
gtt report --query=merge_requests

# limit the parts included in the report: stats, issues, merge_requests, records
gtt report --report=stats --report=records

# hide headlines in the report
gtt report --no_headlines

# hide warnings in the report
gtt report --no_warnings

# set date format
# format options: http://momentjs.com/docs/#/displaying/format/
gtt report --date_format="DD.MM.YYYY HH:mm:ss"

# set time format
# for options, see configuration
gtt report --time_format="[%sign][%days>d ][%hours>h ][%minutes>m ][%seconds>s]"

# set columns for time records list
gtt report --record_columns=user --record_columns=date --record_columns=time

# set columns for issue list
gtt report --issue_columns=iid --issue_columns=title --issue_columns=time_username

# set columns for merge request list
gtt report --merge_request_columns=iid --merge_request_columns=title --merge_request_columns=time_username

# add time columns for all available users to issues and merge requests
gtt report --user_columns

# only include issues and merge requests that have the following labels
gtt report --include_by_labels=critical --include_by_labels=important

# exclude issues and merge requests that have the following labels
gtt report --exclude_by_labels=wont-fix --exclude_by_labels=ignore

# only include the given labels in the results
gtt report --include_labels=pending --include_labels=approved

# exclude the given labels from the results
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

# issue columns to include in the report
# available columns: id, iid, title, project_id, description, labels, milestone,
# assignee, author, closed, updated_at, created_at, state, spent, total_spent, 
# total_estimate
#
# you can include time spent by a specific user by adding a column that follows 
# this convention: time_username
issueColumns:
- iid
- title
- estimation

# merge request columns to include in the report
# available columns: id, iid, title, project_id, description, labels, milestone,
# assignee, author, updated_at, created_at, state, spent, total_spent, total_estimate
#
# you can include time spent by a specific user by adding a column that follows 
# this convention: time_username
mergeRequestColumns:
- iid
- title
- estimation

# columns of time records to include in the report
# available columns: user, date, type, iid, time
recordColumns:
- user
- iid
- time

# add time columns for all available users to issues and merge requests
userColumns: true

# date format
# format options: http://momentjs.com/docs/#/displaying/format/
dateFormat: DD.MM.YYYY HH:mm:ss

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

# query only the given data types: issues, merge_requests
query:
- issues

# include the given parts in the report: stats, issues, merge_requests, records
report:
- stats
- records

# hide headlines in report
noHeadlines: true

# hide warnings in report
noWarnings: true

# change number of concurrent connections. 
# handle with care, we don't want to spam GitLabs API too much
_parallel: 4

# change rows per page (max. 100)
_perPage: 100
```

### use as a library

```
# install as dependency
yarn add gitlab-time-tracker
```

```
// require modules
const Config = require('gitlab-time-tracker/include/config');
const Report = require('gitlab-time-tracker/model/report');

// create a default config
let config = new Config();

// set some vars on config
config.set('token', 'abcdefghijklmnopqrst');
config.set('project', 'namespace/project');

// create report
let report = new Report(config);

// chain promises to query and process data
report.project()
      .then(report.issues, error => {})
      .then(report.mergeRequests, error => {})
      .then(report.processIssues, error => {})
      .then(report.processMergeRequests, error => {});
      
// access data on report
report.issues.forEach(issue => {
    console.log(issue.times);
    console.log(issue.times[0].time);
});
report.mergeRequests.forEach(mergeRequest => {
    console.log(mergeRequests.times);
    console.log(issue.times[0].user);
});

```

### faqs

#### What is the difference between 'total spent' and 'spent'?

`total spent` is the total amount of time spent in all issues after filtering.
It can include times outside the queried time frame. `spent` on the other hand
is the total amount of time spent in the given time frame.

### license

GPL v2