<?php

namespace kriskbx\gtt\Commands;

use Carbon\Carbon;
use Gitlab\Api\Issues;
use Illuminate\Support\Collection;
use kriskbx\gtt\Issue;
use kriskbx\gtt\Output\Table;
use kriskbx\gtt\Project;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Class ReportProject
 * @package kriskbx\gtt\Commands
 */
class ReportProject extends BaseCommand
{
    /**
     * Check mark
     * @var string
     */
    protected $check = '<fg=green>✔</>';

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
            ->setDescription('Get metrics');

        parent::configure();
    }

    /**
     * Execute the command.
     *
     * @param InputInterface $input
     * @param OutputInterface $output
     *
     * @return void
     *
     * @throws \Exception
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        parent::execute($input, $output);

        list($from,
            $to,
            $closed,
            $projectName,
            $columns,
            $user,
            $questionHelper,
            $file,
            $milestone,
            $outputOption,
            $includeLabels,
            $excludeLabels
            ) = $this->getConfiguration($input);

        // Get project
        $project = $this->getProject($output, $projectName);

        // Get params (for filtering via milestone/label/closed)
        $params = $this->getParams($closed, $milestone);

        // Get issues
        $issues = $this->getIssues($output, $project, $params, $includeLabels, $excludeLabels);
        $issues = $this->filterIssuesByArgument($issues, $input);

        if ($issues->count() == 0) {
            throw new \Exception('No issues found that match your criteria!');
        }

        // Set time records in issues
        $issues = $this->setTimesInIssues($output, $issues, $from, $to, $user);

        // Choose output
        if ( ! $outputOption) {
            $outputInstance = new Table($input, $output, $questionHelper, $columns, $file);
        } elseif (array_key_exists($outputOption, $this->outputs)) {
            $outputClassName = $this->outputs[$outputOption];
            $outputInstance  = new $outputClassName($input, $output, $questionHelper, $columns, $file);
        } else {
            throw new \Exception("Output '{$output}' not found!");
        }

        // Put everything out there!
        $outputInstance->render($issues, $this->config);

        $output->writeln("<fg=green>Done!</> 🍺");
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
     * Get all Issues by the given project and params.
     *
     * @param OutputInterface $output
     * @param Project $project
     * @param array $params
     *
     * @param null $includeLabels
     * @param array $excludeLabels
     *
     * @return Collection
     */
    protected function getIssues(
        OutputInterface $output,
        Project $project,
        array $params,
        $includeLabels = null,
        $excludeLabels = []
    ) {
        $output->write("* Getting issues... ");

        $issues = collect([]);

        $page    = 1;
        $perPage = 100;

        // Loop through all pages
        while (true) {
            $response = collect((new Issues($this->client))->all($project->id, $page, $perPage, $params));
            $issues   = $issues->merge($response);

            $page++;

            if ($response->count() < $perPage) {
                break;
            }
        }

        // Create Issue objects
        $issues = $issues->map(function ($data) use ($project, $includeLabels, $excludeLabels) {
            $issue = Issue::fromArray($this->client, $project, $data);

            $issue->setIncludeLabels($includeLabels);
            $issue->setExcludeLabels($excludeLabels);

            return $issue;
        });

        $output->writeln($this->check);

        return $issues;
    }

    /**
     * Set times in the given issues.
     *
     * @param OutputInterface $output
     * @param Collection $issues
     * @param string $user
     * @param Carbon $from
     * @param Carbon $to
     *
     * @return Collection
     *
     * @throws \Exception
     */
    protected function setTimesInIssues(OutputInterface $output, Collection $issues, Carbon $from, Carbon $to, $user)
    {
        $progress = new ProgressBar($output, $issues->count());
        $progress->setFormat('* Processing issues... %current%/%max% [%bar%] %percent:3s%% | <fg=green>%remaining%</>');

        // Add times to each Issue
        $issues = $issues->map(function (Issue $issue) use ($from, $to, $user, &$progress) {
            $issue->setTimes($from, $to, $user);

            $progress->advance();

            return $issue;
        });

        // Filter issues with empty times
        $issues = $issues->filter(function (Issue $issue) {
            return $issue->getTimes()->count() > 0;
        });

        $progress->finish();

        return $issues;
    }

    /**
     * Get configuration based upon the passed config, options and arguments.
     *
     * @param InputInterface $input
     *
     * @return array
     */
    protected function getConfiguration(InputInterface $input)
    {
        $from           = Carbon::parse($input->getOption('from') ?: '01-01-1977');
        $to             = $input->getOption('to') ? Carbon::parse($input->getOption('to')) : Carbon::now();
        $closed         = $input->getOption('closed') === null ? $this->config['closed'] : $input->getOption('closed');
        $milestone      = $input->getOption('milestone') === null ? $this->config['milestone'] : $input->getOption('milestone');
        $projectName    = $input->getArgument('project') ?: $this->config['project'];
        $columns        = array_merge($input->getOption('columns') ?: $this->config['columns'], ['times']);
        $user           = $input->getOption('user') ?: false;
        $questionHelper = $this->getHelper('question');
        $file           = $input->getOption('file');
        $outputOption   = $input->getOption('output') === null ? $this->config['output'] : $input->getOption('output');
        $includeLabels  = $input->getOption('include_labels') === null ? $this->config['includeLabels'] : $input->getOption('include_labels');
        $excludeLabels  = $input->getOption('exclude_labels') === null ? $this->config['excludeLabels'] : $input->getOption('exclude_labels');

        return [
            $from,
            $to,
            $closed,
            $projectName,
            $columns,
            $user,
            $questionHelper,
            $file,
            $milestone,
            $outputOption,
            $includeLabels,
            $excludeLabels
        ];
    }

    /**
     * Filter issues by the 'issue' argument.
     *
     * @param Collection $issues
     * @param InputInterface $input
     *
     * @return Collection
     */
    protected function filterIssuesByArgument(Collection $issues, InputInterface $input)
    {
        if ($input->getArgument('issue')) {
            $issues = $issues->filter(function ($issue) use ($input) {
                return in_array($issue->id, $input->getArgument('issue'))
                       || in_array($issue->iid, $input->getArgument('issue'));
            });
        }

        return $issues;
    }


    /**
     * Get params for querying issues. Is sued to filter out issues in the first place.
     *
     * @param bool $closed
     * @param string $milestone
     *
     * @return array
     */
    protected function getParams($closed, $milestone)
    {
        $params = [];

        if ($closed == false) {
            $params['state'] = 'opened';
        }

        if ($milestone) {
            $params['milestone'] = $milestone;
        }

        return $params;
    }
}