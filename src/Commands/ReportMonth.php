<?php


namespace kriskbx\gtt\Commands;


use Carbon\Carbon;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class ReportMonth extends Command
{
    protected function configure()
    {
        $this
            ->setName('report:month')
            ->addArgument('project', InputArgument::OPTIONAL,
                'Id or project namespace. Defaults to project defined in config.')
            ->addArgument('month', InputArgument::OPTIONAL, 'Date of the month, defaults to last month.')
            ->setDescription('Get metrics for a month');
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $command         = $this->getApplication()->find('report');
        $month           = $input->getArgument('month') ? Carbon::parse($input->getArgument('month')) : Carbon::now()->subMonth(1);
        $firstDayOfMonth = Carbon::parse($month->format('Y-m-') . '01 00:00:00');
        $lastDayOfMonth  = $firstDayOfMonth->copy()->addMonth();

        $output->writeln("* Querying times from " . $firstDayOfMonth->format('Y-m-d') . " to " . $lastDayOfMonth->format('Y-m-d'));

        $input = new ArrayInput([
            'command'  => 'report',
            'project'  => $input->getArgument('project'),
            '--closed' => true,
            '--from'   => $firstDayOfMonth->format('Y-m-d H:i:s'),
            '--to'     => $lastDayOfMonth->format('Y-m-d H:i:s')
        ]);

        $command->run($input, $output);
    }
}