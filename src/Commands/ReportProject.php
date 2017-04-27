<?php

namespace kriskbx\gtt\Commands;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use kriskbx\gtt\Output\TableOutput;
use kriskbx\gtt\Report;
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
     * @var Report
     */
    protected $report;

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

        // overwrite config
        if ($input->getArgument('project')) {
            $this->config['projectName'] = $input->getArgument('project');
        }
        if ($input->getOption('from')) {
            $this->config['from'] = Carbon::parse($input->getOption('from'));
        }
        if ($input->getOption('to')) {
            $this->config['to'] = Carbon::parse($input->getOption('to'));
        }
        if ($input->getOption('closed')) {
            $this->config['closed'] = $input->getOption('closed');
        }
        if ($input->getOption('milestone')) {
            $this->config['milestone'] = $input->getOption('milestone');
        }
        if ($input->getOption('columns')) {
            $this->config['columns'] = $input->getOption('columns');
        }
        if ($input->getOption('user')) {
            $this->config['user'] = $input->getOption('user');
        }
        if ($input->getOption('include_labels')) {
            $this->config['includeLabels'] = $input->getOption('include_labels');
        }
        if ($input->getOption('exclude_labels')) {
            $this->config['excludeLabels'] = $input->getOption('exclude_labels');
        }
        if ($input->getOption('include_by_labels')) {
            $this->config['includeByLabels'] = $input->getOption('include_by_labels');
        }
        if ($input->getOption('exclude_by_labels')) {
            $this->config['excludeByLabels'] = $input->getOption('exclude_by_labels');
        }
        if ($input->getOption('time_format')) {
            $this->config['timeFormat'] = $input->getOption('time_format');
        }

        // init report
        $output->write("* Making sure project '{$this->config['projectName']}' exists... ");
        $this->report = new Report($this->client, $this->config);
        $output->writeln($this->check);

        // get output
        $outputInstance = $this->getOutput($input, $output);

        // get issues
        $output->write("* Getting issues... ");
        $this->report->setIssues();
        $this->filterIssuesByArgument($input);
        if (($issueCount = $this->report->getIssues()->count()) == 0) {
            throw new \Exception('No issues or merge requests found that match your criteria!');
        }
        $output->writeln($this->check);

        // set time records in issues
        $progress = new ProgressBar($output, $issueCount);
        $progress->setFormat('* Processing issues... %current%/%max% [%bar%] %percent:3s%% | <fg=green>%remaining%</>');
        $this->report->setTimesInIssues(function () use (&$progress) {
            $progress->advance();
        });
        $progress->finish();

        // put everything out there!
        $outputInstance->render($this->report->getIssues(), 'Issues', $this->config->toArray());

        $output->writeln("<fg=green>Done!</> 🍺");
    }

    /**
     * @param InputInterface $input
     *
     * @return Collection
     */
    protected function filterIssuesByArgument(InputInterface $input)
    {
        if ($input->getArgument('issue')) {
            $this->report->filterIssues(function ($issue) use ($input) {
                return in_array($issue->id, $input->getArgument('issue'))
                       || in_array($issue->iid, $input->getArgument('issue'));
            });
        }
    }

    /**
     * @param InputInterface $input
     * @param OutputInterface $output
     *
     * @return TableOutput
     * @throws \Exception
     */
    protected function getOutput(InputInterface $input, OutputInterface $output)
    {
        $file           = $input->getOption('file');
        $outputOption   = $input->getOption('output') === null ? $this->config['output'] : $input->getOption('output');
        $questionHelper = $this->getHelper('question');

        if ( ! $outputOption) {
            $outputInstance = new TableOutput($input, $output, $questionHelper, $this->report->getColumns(), $file);
        } elseif (array_key_exists($outputOption, $this->outputs)) {
            $outputClassName = $this->outputs[$outputOption];
            $outputInstance  = new $outputClassName($input, $output, $questionHelper, $this->report->getColumns(),
                $file);
        } else {
            throw new \Exception("Output '{$outputOption}' not found!");
        }

        return $outputInstance;
    }
}