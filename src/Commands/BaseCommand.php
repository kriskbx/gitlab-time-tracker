<?php


namespace kriskbx\gtt\Commands;

use Gitlab\Client;
use kriskbx\gtt\Config\Config;
use kriskbx\gtt\Output\CsvOutput;
use kriskbx\gtt\Output\MarkdownOutput;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class BaseCommand extends Command
{
    /**
     * Config array.
     * @var Config
     */
    protected $config;

    /**
     * GitLab client.
     * @var Client
     */
    protected $client;

    /**
     * Outputs
     * @var array
     */
    protected $outputs = [
        'markdown' => MarkdownOutput::class,
        'csv'      => CsvOutput::class
    ];

    /**
     * ReportMonth constructor.
     *
     * @param Client $client
     * @param Config $config
     */
    public function __construct(Client $client, Config $config)
    {
        $this->config = $config;
        $this->client = $client;

        parent::__construct();
    }

    /**
     * Check config before executing.
     *
     * @param InputInterface $input
     * @param OutputInterface $output
     *
     * @return void
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        if ( ! @$this->config['token']) {
            ($this->getApplication()->find('login'))->run(new ArrayInput([]), $output);
            exit(0);
        }
    }

    /**
     * Configure base options for every command.
     */
    protected function configure()
    {
        $this->addOption('closed', null, InputOption::VALUE_REQUIRED,
            'Include closed issues and merged merge requests, defaults to false')
             ->addOption('columns', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY,
                 'Include the given columns in the report')
             ->addOption('date_format', null, InputOption::VALUE_REQUIRED, 'Date format')
             ->addOption('user', null, InputOption::VALUE_OPTIONAL, 'Filter times by the given user', null)
             ->addOption('milestone', null, InputOption::VALUE_OPTIONAL, 'Filter times by the given milestone', null)
             ->addOption('output', null, InputOption::VALUE_OPTIONAL,
                 'Choose output, default prints to stdout. Available: ' . implode(', ', array_keys($this->outputs)),
                 null)
             ->addOption('file', null, InputOption::VALUE_OPTIONAL,
                 'If output supports file-saving, specify the path to the file', null)
             ->addOption('include_by_labels', null, InputOption::VALUE_OPTIONAL | InputOption::VALUE_IS_ARRAY,
                 'Include only issues and merge requests by the given labels', null)
             ->addOption('include_labels', null, InputOption::VALUE_OPTIONAL | InputOption::VALUE_IS_ARRAY,
                 'Include only the given labels in the result', null)
             ->addOption('exclude_labels', null, InputOption::VALUE_OPTIONAL | InputOption::VALUE_IS_ARRAY,
                 'Exclude the given labels from the result', null)
             ->addOption('exclude_by_labels', null, InputOption::VALUE_OPTIONAL | InputOption::VALUE_IS_ARRAY,
                 'Exclude issues and merge requests by the given labels', null);;
    }

    /**
     * Get default arguments.
     *
     * @param InputInterface $input
     *
     * @return array
     */
    protected function getDefaultArguments(InputInterface $input)
    {
        $arguments = [];

        if ($input->getOption('closed')) {
            $arguments['--closed'] = $input->getOption('closed');
        }
        if ($input->getOption('columns')) {
            $arguments['--columns'] = $input->getOption('columns');
        }
        if ($input->getOption('date_format')) {
            $arguments['--date_format'] = $input->getOption('date_format');
        }
        if ($input->getOption('user')) {
            $arguments['--user'] = $input->getOption('user');
        }
        if ($input->getOption('milestone')) {
            $arguments['--milestone'] = $input->getOption('milestone');
        }
        if ($input->getOption('file')) {
            $arguments['--file'] = $input->getOption('file');
        }
        if ($input->getOption('include_labels')) {
            $arguments['--include_labels'] = $input->getOption('include_labels');
        }
        if ($input->getOption('include_by_labels')) {
            $arguments['--include_by_labels'] = $input->getOption('include_by_labels');
        }
        if ($input->getOption('exclude_labels')) {
            $arguments['--exclude_labels'] = $input->getOption('exclude_labels');
        }
        if ($input->getOption('exclude_by_labels')) {
            $arguments['--exclude_by_labels'] = $input->getOption('exclude_by_labels');
        }

        return $arguments;
    }
}