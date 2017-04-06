# gitlab-time-tracker

> A command line interface that makes working with GitLabs time tracking feature more enjoyable.

### requirements

* **php >= 7.0** (5.6 won't work)

### installation

#### using composer

Make sure composer is [installed globally](https://getcomposer.org/doc/00-intro.md#globally) and `~/.composer/vendor/bin` is in your [PATH](http://subinsb.com/install-run-composer-binaries-globally). Then simply run:

```
composer global require kriskbx/gitlab-time-tracker
```

#### using docker

> coming soon

### commands

#### login

Login to gitlab.com or your own GitLab instance using a private token.

```
gtt login
```

#### edit configuration

Edit the global configuration file. [Available options](#options)

```
gtt edit
```

#### reports

Get a report for your project or issue.

```
# available report commands
gtt report ["namespace/project"] [issue_id]
gtt report:month ["2017-03"] ["namespace/project"]
gtt report:day ["2017-03-01"] ["namespace/project"]

# include closed issues
gtt report --closed=true

# limit to a user
gtt report --user=username

# limit to a milestone
gtt report --milestone=milestone_name

# overwrite the default date format or the date format stored in your config
gtt report --date_format="d.m.Y H:i:s"

# overwrite the default columns or the columns stored in your config
gtt report --columns=iid --columns=title --columns=estimation

# only include the given labels in the results, overwrites the includeLabels stored in your config file
gtt report --include_labels=pending --include_labels=approved

# exclude the given labels from the results, overwrites the excludeLabels stored in your config file
gtt report --exclude_labels=bug --exclude_labels=feature

# choose a different output than a stdout table (csv & json coming soon)
gtt report --output=markdown --file=filename.md
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

# default milestone
milestone: milestone_name

# hours per day
hoursPerDay: 8

# columns
columns:
- iid
- title
- estimation

# date format
dateFormat: Y-m-d H:i:s

# default output
output: markdown

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

#### why php? why not ruby/node/go/python/erlang?

Because I'm a PHP dev. And I like PHP. Actually PHP is not that bad. Shut up and get a life.

### license

GPL v2