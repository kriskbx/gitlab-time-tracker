<?php


namespace kriskbx\gtt\Commands;


use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\QuestionHelper;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\Question;

class Login extends Command
{
    /**
     * @var string
     */
    private $apiRegex = '/^url: (.*)$/m';

    /**
     * @var string
     */
    private $tokenRegex = '/^token: (.*)$/m';

    /**
     * @var string
     */
    private $configFile;

    /**
     * Login constructor.
     *
     * @param null|string $configFile
     */
    public function __construct($configFile)
    {
        $this->configFile = $configFile;

        parent::__construct();
    }

    /**
     * Configure.
     */
    protected function configure()
    {
        $this
            ->setName('login')
            ->setDescription('Login to GitLab');
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
        $helper = $this->getHelper('question');

        $api   = $this->getApiUri($input, $output, $helper);
        $token = $this->getApiToken($input, $output, $helper, $api);

        $config = file_get_contents($this->configFile);

        if (preg_match_all($this->apiRegex, $config)) {
            $config = preg_replace($this->apiRegex, "url: {$api}", $config);
        } else {
            $config .= "\nurl: {$api}";
        }

        if (preg_match_all($this->tokenRegex, $config)) {
            $config = preg_replace($this->tokenRegex, "token: {$token}", $config);
        } else {
            $config .= "\ntoken: {$token}";
        }

        file_put_contents($this->configFile, $config, LOCK_EX);

        $output->writeln("\nYour configuration has been saved to: '{$this->configFile}'\n");
    }

    /**
     * Get api uri.
     *
     * @param InputInterface $input
     * @param OutputInterface $output
     * @param QuestionHelper $helper
     *
     * @return string
     */
    protected function getApiUri(InputInterface $input, OutputInterface $output, QuestionHelper $helper)
    {
        $question = new Question("<info>Enter GitLab base API uri:</info> (default: http://gitlab.com/api/v4/)\n",
            'http://gitlab.com/api/v4/');
        $question->setValidator(function ($answer) {
            if ( ! @json_encode(@file_get_contents($answer))) {
                throw new \RuntimeException("Cannot reach the API, are you sure it's the right uri?");
            }

            return $answer;
        });
        $question->setMaxAttempts(5);

        return $helper->ask($input, $output, $question);
    }

    /**
     * Get api token.
     *
     * @param InputInterface $input
     * @param OutputInterface $output
     * @param QuestionHelper $helper
     * @param $api
     *
     * @return string
     */
    protected function getApiToken(InputInterface $input, OutputInterface $output, QuestionHelper $helper, $api)
    {
        $globalAnswer = '';

        $question = new Question("<info>Enter your private access token:</info> (You can set it up here: https://gitlab.com/profile/personal_access_tokens)\n");
        $question->setValidator(function ($answer) use ($api, &$globalAnswer) {
            $client = new \Gitlab\Client($api);
            $client->authenticate($answer, \Gitlab\Client::AUTH_URL_TOKEN);
            $globalAnswer = $answer;

            try {
                $client->namespaces->all();
            } catch (\Exception $e) {
                throw new \RuntimeException("Cannot reach the API, are you sure it's the right token and uri?");
            }
        });
        $question->setMaxAttempts(5);

        $helper->ask($input, $output, $question);

        return $globalAnswer;
    }
}