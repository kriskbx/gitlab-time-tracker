<?php


namespace kriskbx\gtt\Commands;

use Carbon\Carbon;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class ReportDay extends BaseCommand
{
    /**
     * Configure.
     */
    protected function configure()
    {
        $this
            ->setName('report:day')
            ->addArgument('day', InputArgument::OPTIONAL, 'Date of the day, defaults to today.')
            ->addArgument('project', InputArgument::OPTIONAL,
                'Id or project namespace. Defaults to project defined in config.')
            ->setDescription('Get metrics for a month');

        parent::configure();
    }

    /**
     * Execute.
     *
     * @param InputInterface $input
     * @param OutputInterface $output
     *
     * @return void
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        parent::execute($input, $output);

        $command = $this->getApplication()->find('report');

        $day = $input->getArgument('day') ? Carbon::parse($input->getArgument('day')) : Carbon::now();
        $from  = Carbon::parse($day->format('Y-m-d') . ' 00:00:00');
        $to    = $from->copy()->addDay();

        $output->writeln("* Querying times from '" . $from->format($this->config['dateFormat']) . "' to '" . $to->format($this->config['dateFormat']) . "'");

        $arguments = [
            'command' => 'report',
            'project' => $input->getArgument('project'),
            '--from'  => $from->format('Y-m-d H:i:s'),
            '--to'    => $to->format('Y-m-d H:i:s')
        ];

        $command->run(new ArrayInput(array_merge($arguments, $this->getDefaultArguments($input))), $output);
    }
}