<?php


namespace kriskbx\gtt\Output;


use kriskbx\gtt\Issue;
use kriskbx\gtt\Time;
use Symfony\Component\Console\Helper\QuestionHelper;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ConfirmationQuestion;

abstract class AbstractOutput implements \kriskbx\gtt\Output\OutputInterface
{
    /**
     * @var array
     */
    protected $totalTimeByUser = [];

    /**
     * @var int
     */
    protected $totalTime = 0;

    /**
     * @var InputInterface
     */
    protected $input;

    /**
     * @var OutputInterface
     */
    protected $output;

    /**
     * @var QuestionHelper
     */
    protected $questionHelper;

    /**
     * @var array
     */
    protected $columns;

    /**
     * @var string
     */
    protected $file;

    /**
     * Output constructor.
     *
     * @param InputInterface $input
     * @param OutputInterface $output
     * @param QuestionHelper $questionHelper
     * @param array $columns
     * @param string $file
     */
    public function __construct(
        InputInterface $input,
        OutputInterface $output,
        QuestionHelper $questionHelper,
        array $columns,
        $file
    ) {
        $this->input          = $input;
        $this->output         = $output;
        $this->columns        = $columns;
        $this->questionHelper = $questionHelper;
        $this->file           = $file;
    }

    /**
     * Add the times of the given issue to the total amount.
     *
     * @param Issue $issue
     */
    protected function addToTotal(Issue $issue)
    {
        $issue->getTimes()->each(function ($times, $user) {
            if ( ! @$this->totalTimeByUser[$user]) {
                $this->totalTimeByUser[$user] = 0;
            }

            $times->each(function (Time $time) use ($user) {
                $this->totalTimeByUser[$user] += $time->getSeconds();
                $this->totalTime              += $time->getSeconds();
            });
        });
    }

    /**
     * Write the given contents to the given file.
     *
     * @param string $contents
     * @param string $file
     *
     * @throws \Exception
     */
    protected function write($contents, $file)
    {
        // WE NEED SPACES!
        $this->output->writeln('');
        $this->output->writeln('');

        if ( ! $file) {
            throw new \Exception('You have to specify a file path using the --file option!');
        }

        if (file_exists($file)) {
            $question = new ConfirmationQuestion(
                "File '{$file}' exist. Overwrite it?",
                true,
                '/^(y|j)/i'
            );

            if ( ! $this->questionHelper->ask($this->input, $this->output, $question)) {
                throw new \Exception("Could not write file '{$file}'");
            }

            unlink($file);
        }

        if ( ! file_exists(dirname($file))) {
            mkdir(dirname($file), 0755, true);
        }

        touch($file);
        file_put_contents($file, $contents);
    }
}