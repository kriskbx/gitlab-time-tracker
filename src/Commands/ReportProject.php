<?php

namespace kriskbx\gtt\Commands;

use Carbon\Carbon;
use DateTime;
use Gitlab\Api\Issues;
use Gitlab\Client;
use Gitlab\Model\Project;
use Illuminate\Support\Collection;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Helper\TableSeparator;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ConfirmationQuestion;
use Symfony\Component\Console\Question\Question;

class ReportProject extends Command
{
    /**
     * GitLab client.
     * @var Client
     */
    private $client;

    /**
     * Config array.
     * @var array
     */
    private $config;

    /**
     * Check mark.
     * @var string
     */
    protected $check = '<fg=green>✔</>';

    /**
     * ReportProject constructor.
     *
     * @param Client $client
     * @param array $config
     */
    public function __construct(Client $client, Array $config)
    {
        parent::__construct(null);

        $this->client = $client;
        $this->config = $config;
    }

    /**
     * Configure the command.
     */
    protected function configure()
    {
        $this
            ->setName('report')
            ->addArgument('project', InputArgument::OPTIONAL,
                'Id or project namespace. Defaults to project defined in config.')
            ->addArgument('issue', InputArgument::OPTIONAL | InputArgument::IS_ARRAY, 'Id of a specific issue.')
            ->addOption('from', null, InputOption::VALUE_REQUIRED, 'Date from. Defaults to 01-01-1977')
            ->addOption('to', null, InputOption::VALUE_REQUIRED, 'Date to. Defaults to now')
            ->addOption('closed', null, InputOption::VALUE_REQUIRED, 'Include closed issues, defaults to false')
            ->addOption('columns', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY,
                'Include the given columns in the report')
            ->addOption('date_format', null, InputOption::VALUE_REQUIRED, 'Date format, defaults to d.m.Y H:I')
            ->addOption('user', null, InputOption::VALUE_OPTIONAL, 'Filter times by the given user', null)
            ->addOption('file', null, InputOption::VALUE_OPTIONAL,
                'Save details to file instead of printing them to stdout', null)
//            ->addOption('milestone', null, InputOption::VALUE_OPTIONAL, 'Filter times by the given milestone', null)
            ->setDescription('Get metrics');
    }

    /**
     * Execute the command.
     *
     * @param InputInterface $input
     * @param OutputInterface $output
     *
     * @return void
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        list($from, $to, $closed, $projectName, $columns, $user, $total, $totalByUser) = $this->setConfiguration($input);

        // Get project
        $project = $this->getProject($output, $projectName);

        // Set params
        $params = [];
        if ($closed == false) {
            $params['state'] = 'opened';
        }

        // Get issues
        $issues = $this->getAndProcessIssues($input, $output, $project, $params, $user, $from, $to);

        // Print
        if ( ! $input->getOption('file')) {
            $this->detailsToStdOut($output, $columns, $issues, $total, $totalByUser);
        } else {
            $contents = $this->detailsToMarkDown($columns, $issues, $total, $totalByUser);
            $this->writeToFile($input, $output, $contents);
        }

        $output->writeln("<fg=green>Done!</> 🍺");
    }

    /**
     * Get labels.
     * Filter out excludeLabels and only include the includeLabels.
     *
     * @param array $labels
     *
     * @return Collection
     */
    protected function getLabels($labels)
    {
        return collect($labels)->filter(function ($label) {
            return ( ! in_array($label, $this->config['excludeLabels']))
                   && (count($this->config['includeLabels']) == 0 || in_array($label, $this->config['includeLabels']));
        });
    }

    /**
     * Get Project by the given name.
     *
     * @param OutputInterface $output
     * @param string $projectName
     *
     * @return Project
     * @throws \Exception
     */
    protected function getProject(OutputInterface $output, $projectName)
    {
        $output->write("* Making sure project '{$projectName}' exists... ");

        try {
            $project = (new Project($projectName, $this->client))->show();
        } catch (\Exception $e) {
            throw new \Exception("Project '{$projectName}' not found!", 1, $e);
        }

        $output->writeln($this->check);

        return $project;
    }

    /**
     * Get Issues by the given project and params.
     *
     * @param OutputInterface $output
     * @param Project $project
     * @param array $params
     *
     * @return Collection
     */
    protected function getIssues(OutputInterface $output, Project $project, array $params)
    {
        $output->write("* Getting issues... ");

        $issues  = new Issues($this->client);
        $queried = collect([]);

        $page    = 1;
        $perPage = 50;

        while (true) {
            $response = collect($issues->all($project->id, $page, $perPage, $params));
            $queried  = $queried->merge($response);

            $page++;

            if ($response->count() < $perPage) {
                break;
            }
        }

        $output->writeln($this->check);

        return $queried;
    }

    /**
     * Get time for the given issue id.
     *
     * @param Project $project
     * @param integer $issue
     * @param Carbon $from
     * @param Carbon $to
     * @param string $user
     *
     * @return Collection
     */
    protected function getTimes(Project $project, $issue, Carbon $from, Carbon $to, $user)
    {
        $issues = new Issues($this->client);

        return collect($issues->showComments($project->id, $issue))
            // filter time-tracking comments
            ->filter(function ($issue) {
                return $issue['system'] && preg_match_all($this->config['timeRegex'], $issue['body']);
            })
            // group by author
            ->groupBy('author.name')
            // convert time to seconds
            ->map(function ($comments) use ($to, $from) {
                return collect($comments)
                    ->map(function ($comment) use ($to, $from) {
                        // get time
                        preg_match($this->config['timeRegex'], $comment['body'], $matches);
                        $time = $this->toSeconds($matches[1]);

                        // filter out time sessions by to/from
                        $date = Carbon::parse($comment['created_at']);

                        if ( ! $date->greaterThanOrEqualTo($from) || ! $date->lessThanOrEqualTo($to)) {
                            return false;
                        }

                        return compact('time', 'date');
                    })
                    ->filter(function ($comment) {
                        return is_array($comment);
                    });
            })
            ->filter(function ($comments, $key) use ($user) {
                return $comments->count() > 0 && ($user == false || $key == $user);
            });
    }

    /**
     * Process issues: parsing dates and getting times.
     *
     * @param OutputInterface $output
     * @param Collection $issues
     * @param Project $project
     * @param string $user
     * @param Carbon $from
     * @param Carbon $to
     *
     * @return Collection
     * @throws \Exception
     */
    protected function processIssues(
        OutputInterface $output,
        Collection $issues,
        Project $project,
        $user,
        Carbon $from,
        Carbon $to
    ) {
        if ($issues->count() == 0) {
            throw new \Exception('No issues found that match your criteria!');
        }

        $progress = new ProgressBar($output, $issues->count());
        $progress->setFormat('* Processing issues... %current%/%max% [%bar%] %percent:3s%% | <fg=green>%remaining%</>');

        $issues = $issues->map(function ($issue) use ($from, $to, $user, $project, &$progress) {
            $issue['created_at'] = Carbon::parse($issue['created_at']);
            $issue['updated_at'] = Carbon::parse($issue['updated_at']);
            $issue['times']      = $this->getTimes($project, $issue['id'], $from, $to, $user);

            $progress->advance();

            return $issue;
        });

        $progress->finish();

        return $issues;
    }

    /**
     * Format issue for the table view.
     *
     * @param array $issue
     * @param array $columns
     *
     * @param string $highlightStart
     * @param string $highlightEnd
     * @param string $break
     *
     * @return array
     */
    protected function formatIssue(
        array $issue,
        array $columns,
        $highlightStart = "<fg=green>",
        $highlightEnd = "</>",
        $break = "\n"
    ) {
        return collect($issue)
            // filter columns
            ->filter(function ($value, $key) use ($columns) {
                return in_array($key, $columns);
            })
            // create a string representation of the times
            ->map(function ($issue, $key) use ($highlightStart, $highlightEnd, $break) {
                if ($key != 'times') {
                    return $issue;
                }

                $string = '';
                $first  = true;

                $issue->each(function ($value, $key) use (&$string, &$first, $highlightStart, $highlightEnd, $break) {
                    if ( ! $first) {
                        $string .= "{$break}{$break}";
                        $first  = false;
                    }

                    $total = $this->toHumanReadable($value->reduce(function ($carry, $item) {
                        return $carry + (int)$item['time'];
                    }));

                    $string .= "{$highlightStart}{$key}{$highlightEnd} {$total}{$break}";
                    $count  = count($value);

                    $value->each(function ($value, $key) use (
                        &$string,
                        $count,
                        $highlightStart,
                        $highlightEnd,
                        $break
                    ) {
                        $string .= $highlightStart . $this->toHumanReadable($value['time']) . $highlightEnd;
                        $string .= " (" . $value['date']->format($this->config['dateFormat']) . ")";

                        if ($key < $count - 1) {
                            $string .= "{$break}";
                        }
                    });
                });

                return $string;
            })
            ->toArray();
    }

    /**
     * Human readable string to seconds.
     *
     * @param string $timeString
     *
     * @return int
     */
    protected function toSeconds($timeString)
    {
        preg_match($this->config['parserRegex'], $timeString, $matches);
        $time =
            ((@$matches['days'] ?: 0) * $this->config['hoursPerDay'] * 60 * 60) +
            ((@$matches['hours'] ?: 0) * 60 * 60) +
            ((@$matches['minutes'] ?: 0) * 60) +
            (@$matches['seconds'] ?: 0);

        return $time;
    }

    /**
     * Seconds to human readable string.
     *
     * @param int $inputSeconds
     *
     * @return string
     */
    protected function toHumanReadable($inputSeconds)
    {
        $secondsInAMinute = 60;
        $secondsInAnHour  = 60 * $secondsInAMinute;
        $secondsInADay    = $this->config['hoursPerDay'] * $secondsInAnHour;

        // extract days
        $days = floor($inputSeconds / $secondsInADay);

        // extract hours
        $hourSeconds = $inputSeconds % $secondsInADay;
        $hours       = floor($hourSeconds / $secondsInAnHour);

        // extract minutes
        $minuteSeconds = $hourSeconds % $secondsInAnHour;
        $minutes       = floor($minuteSeconds / $secondsInAMinute);

        // extract the remaining seconds
        $remainingSeconds = $minuteSeconds % $secondsInAMinute;
        $seconds          = ceil($remainingSeconds);

        $string = $days ? (int)$days . 'd ' : '';
        $string .= $hours ? (int)$hours . 'h ' : '';
        $string .= $minutes ? (int)$minutes . 'm ' : '';
        $string .= $seconds ? (int)$seconds . 's' : '';

        return trim($string);
    }

    /**
     * Add the times to total by the given issue.
     *
     * @param array $issue
     * @param int $total
     * @param array $totalByUser
     */
    protected function addToTotalTime(array $issue, &$total, array &$totalByUser)
    {
        $issue['times']->each(function ($time, $key) use (&$total, &$totalByUser) {
            if ( ! @$totalByUser[$key]) {
                $totalByUser[$key] = 0;
            }

            $time->each(function ($time) use (&$total, &$totalByUser, $key) {
                $totalByUser[$key] += $time['time'];
                $total             += $time['time'];
            });
        });
    }

    /**
     * Set configuration based upon the passed config, options and arguments.
     *
     * @param InputInterface $input
     *
     * @return array
     */
    protected function setConfiguration(InputInterface $input)
    {
        $from        = Carbon::parse($input->getOption('from') ?: '01-01-1977');
        $to          = $input->getOption('to') ? Carbon::parse($input->getOption('to')) : Carbon::now();
        $closed      = $input->getOption('closed') === null ? $this->config['closed'] : $input->getOption('closed');
        $projectName = $input->getArgument('project') ?: $this->config['project'];
        $columns     = array_merge($input->getOption('columns') ?: $this->config['columns'], ['times']);
        $user        = $input->getOption('user') ?: false;
        $total       = 0;
        $totalByUser = [];

        return [$from, $to, $closed, $projectName, $columns, $user, $total, $totalByUser];
    }

    /**
     * Get and process issues.
     *
     * @param InputInterface $input
     * @param OutputInterface $output
     * @param Project $project
     * @param array $params
     * @param string $user
     * @param Carbon $from
     * @param Carbon $to
     *
     * @return Collection
     */
    protected function getAndProcessIssues(
        InputInterface $input,
        OutputInterface $output,
        Project $project,
        array $params,
        $user,
        Carbon $from,
        Carbon $to
    ) {
        $issues = $this->getIssues($output, $project, $params);

        if ($input->getArgument('issue')) {
            $issues = $issues->filter(function ($issue) use ($input) {
                return in_array($issue['id'], $input->getArgument('issue'))
                       || in_array($issue['iid'], $input->getArgument('issue'));
            });
        }

        $issues = $this->processIssues($output, $issues, $project, $user, $from, $to);

        return $issues;
    }

    /**
     * Create table.
     *
     * @param OutputInterface $output
     * @param $columns
     *
     * @return Table
     */
    protected function createTable(OutputInterface $output, $columns)
    {
        return (new Table($output))
            ->setHeaders(
                collect($columns)
                    ->map(function ($item) {
                        return ucfirst($item);
                    })->toArray()
            );
    }

    /**
     * Add the given issues to the given table.
     *
     * @param Collection $issues
     * @param array $columns
     * @param int $total
     * @param array $totalByUser
     * @param Table $table
     *
     * @return array
     */
    protected function addIssuesToTable(Collection $issues, array $columns, &$total, array &$totalByUser, Table &$table)
    {
        $first = true;

        $issues->each(function ($issue) use (&$first, &$total, &$totalByUser, &$table, $columns) {
            // skip issues with empty time records
            if ($issue['times']->count() == 0) {
                return;
            }

            if ( ! $first) {
                $table->addRow(new TableSeparator());
            } else {
                $first = false;
            }

            // add total times
            $this->addToTotalTime($issue, $total, $totalByUser);

            // add row
            $table->addRow($this->formatIssue($issue, $columns));
        });
    }

    /**
     * @param array $columns
     * @param Collection $issues
     * @param $total
     * @param array $totalByUser
     *
     * @return string
     */
    protected function detailsToMarkDown(
        array $columns,
        Collection $issues,
        $total,
        array $totalByUser
    ) {
        $string = '';

        // set table headers
        $string .= "| " . implode(" | ", $columns) . " |\n";
        collect($columns)->each(function () use (&$string) {
            $string .= "| --- ";
        });
        $string .= "|";


        $issues->each(function ($issue) use (&$total, &$totalByUser, &$string, $columns) {
            // skip issues with empty time records
            if ($issue['times']->count() == 0) {
                return;
            }

            // add total times
            $this->addToTotalTime($issue, $total, $totalByUser);

            // add row
            $string .= "\n| " . implode(" | ", $this->formatIssue($issue, $columns, "**", "**", '<br>')) . " |";
        });

        $subString = "**Total:** " . $this->toHumanReadable($total) . "\n\n";
        collect($totalByUser)->each(function ($value, $key) use (&$subString) {
            $subString .= "**{$key}:** " . $this->toHumanReadable($value) . "\n\n";
        });

        return $subString . "\n" . $string;
    }

    /**
     * @param OutputInterface $output
     * @param $columns
     * @param $issues
     * @param $total
     * @param $totalByUser
     */
    protected function detailsToStdOut(OutputInterface $output, $columns, $issues, $total, $totalByUser)
    {
        // WE NEED SOME SPACE!
        $output->writeln('');
        $output->writeln('');

        // Create table
        $table = $this->createTable($output, $columns);
        $this->addIssuesToTable($issues, $columns, $total, $totalByUser, $table);

        // Print total times
        $output->writeln('<fg=green>Total:</> ' . $this->toHumanReadable($total));
        collect($totalByUser)->each(function ($value, $key) use (&$output) {
            $output->writeln("<fg=green>{$key}:</> " . $this->toHumanReadable($value));
        });

        // Render table
        $output->writeln('');
        $table->render();
    }

    /**
     * @param InputInterface $input
     * @param OutputInterface $output
     * @param $contents
     *
     * @throws \Exception
     */
    protected function writeToFile(InputInterface $input, OutputInterface $output, $contents)
    {
        $output->writeln('');
        $output->writeln('');

        $file   = $input->getOption('file');
        $helper = $this->getHelper('question');

        if ( ! file_exists($file)) {
            $question = new ConfirmationQuestion(
                "File '{$file}' doesn't exist. Should it be created?",
                true,
                '/^(y|j)/i'
            );

            if ( ! $helper->ask($input, $output, $question)) {
                throw new \Exception("Could not write file '{$file}'");
            }

            if ( ! file_exists(dirname($file))) {
                mkdir(dirname($file), 0755, true);
            }

            touch($file);
        }

        file_put_contents($input->getOption('file'), $contents);
    }

}