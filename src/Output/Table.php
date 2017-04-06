<?php


namespace kriskbx\gtt\Output;


use Illuminate\Support\Collection;
use kriskbx\gtt\Estimation;
use kriskbx\gtt\Issue;
use kriskbx\gtt\Time;
use Symfony\Component\Console\Helper\Table as ConsoleTable;
use Symfony\Component\Console\Helper\TableSeparator;

class Table extends AbstractOutput
{
    /**
     * @var ConsoleTable
     */
    protected $table;

    /**
     * Render.
     *
     * @param Collection $issues
     * @param array $params
     *
     * @return mixed
     */
    public function render(Collection $issues, array $params)
    {
        $params = array_merge($params, [
            'columns'         => $this->columns,
            'delimiter'       => " | ",
            'timesDelimiter'  => "\n\n",
            'break'           => "\n",
            'beforeHighlight' => "<fg=green>",
            'afterHighlight'  => "</>",
            'beforeHeadline'  => "<fg=blue>",
            'afterHeadline'   => "</>"
        ]);

        $params['displayEstimationFunction'] = function (Estimation $estimation, array $params = []) {
            return $this->estimationBar($estimation, $params);
        };

        $this->createTable();

        $firstRow = true;

        $issues->each(function (Issue $issue) use (&$firstRow, $params) {
            if ( ! $firstRow) {
                $this->table->addRow(new TableSeparator());
            } else {
                $firstRow = false;
            }

            $this->addToTotal($issue);
            $this->table->addRow(explode($params['delimiter'], $issue->toString($params)));
        });

        // WE NEED SPACES
        $this->output->writeln('');
        $this->output->writeln('');

        $this->total();
        $this->table->render();

        $this->output->writeln('');
    }

    /**
     * Create table.
     *
     * @return ConsoleTable
     */
    protected function createTable()
    {
        $this->table =
            (new ConsoleTable($this->output))
                ->setHeaders(
                    collect($this->columns)
                        ->map(function ($item) {
                            return camel_case($item);
                        })->toArray()
                );
    }

    /**
     * Get the estimation bar.
     *
     * @param Estimation $estimation
     * @param array $params
     *
     * @return string
     */
    protected function estimationBar(Estimation $estimation, $params = [])
    {
        $color   = "green";
        $percent = $estimation->getTimeEstimate() == 0 ? 1.1 : (int)$estimation->getTotalTimeSpent() / (int)$estimation->getTimeEstimate();

        if ($percent > 1) {
            $percent = 1;
            $color   = "red";
        }

        $string = $estimation->getHumanTotalTimeSpent() . " [";

        for ($i = 1; $i < 11; $i++) {
            if ($i <= ($percent * 10)) {
                $string .= "<fg={$color}>=</>";
            } else {
                $string .= "<fg=black>-</>";
            }
        }

        $string .= "] " . ($estimation->getHumanTimeEstimate() ?: 'N/A');

        return $string;
    }

    /**
     * Print out total stats.
     */
    protected function total()
    {
        $string = "* <fg=blue>Total:</> " . Time::humanReadable($this->totalTime) . "\n";

        collect($this->totalTimeByUser)->each(function ($time, $user) use (&$string) {
            $string .= "* <fg=blue>{$user}:</> " . Time::humanReadable($time) . "\n";
        });

        $this->output->write($string . "\n");
    }
}