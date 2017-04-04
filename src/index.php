<?php

use Gitlab\Client;
use kriskbx\gtt\Commands\ReportMonth;
use kriskbx\gtt\Commands\ReportProject;
use Symfony\Component\Console\Application;
use Symfony\Component\Yaml\Yaml;

// Find composer autoload.php
$autoloadGlobal = __DIR__ . '/../../../autoload.php';
$autoloadLocal  = __DIR__ . '/../vendor/autoload.php';

if (file_exists($autoloadGlobal)) {
    require $autoloadGlobal;
    $GLOBALS['autoloadPath'] = $autoloadGlobal;
} elseif (file_exists($autoloadLocal)) {
    require $autoloadLocal;
    $GLOBALS['autoloadPath'] = $autoloadLocal;
} else {
    throw new Exception("Can't find composer autoload.php");
}

// Parse config
$config = Yaml::parse(file_get_contents(getcwd() . DIRECTORY_SEPARATOR . '.gitlab-time.yml'));

$config['url']           = @$config['url'] ?: 'http://gitlab.com/api/v4/';
$config['token']         = @$config['token'] ?: false;
$config['project']       = @$config['project'] ?: false;
$config['closed']        = @$config['closed'] ?: false;
$config['hoursPerDay']   = @$config['hoursPerDay'] ?: 8;
$config['timeRegex']     = @$config['timeRegex'] ?: '/added (.*) of time spent/i';
$config['parserRegex']   = @$config['parserRegex'] ?: '/^(?:(?<days>\d+)d\s*)?(?:(?<hours>\d+)h\s*)?(?:(?<minutes>\d+)m\s*)?(?:(?<seconds>\d+)s\s*)?$/';
$config['columns']       = @$config['columns'] ?: [];
$config['dateFormat']    = @$config['dateFormat'] ?: 'd.m.Y H:i';
$config['excludeLabels'] = @$config['excludeLabels'] ?: [];
$config['includeLabels'] = @$config['includeLabels'] ?: [];

// Create client
$client = new Client($config['url']);
$client->authenticate($config['token'], Client::AUTH_URL_TOKEN);

// Start CLI
$application = new Application();
$application->add(new ReportProject($client, $config));
$application->add(new ReportMonth());
$application->run();