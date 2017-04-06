<?php

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
    echo "Can't find composer autoload.php";
    exit(1);
}

// Parse config
$configFile = $_SERVER['HOME'] . DIRECTORY_SEPARATOR . '.gitlab-time.yml';
$configDir  = dirname($configFile);

if ( ! file_exists($configDir)) {
    mkdir($configDir, 0755, true);
}
if ( ! file_exists($configFile)) {
    touch($configFile);
}

try {
    $config = Symfony\Component\Yaml\Yaml::parse(file_get_contents($configFile));
} catch (Exception $e) {
    echo "Invalid config file '{$configFile}'.\n";
    exit(1);
}

$config['configFile']    = $configFile;
$config['url']           = @$config['url'] ?: 'http://gitlab.com/api/v4/';
$config['token']         = @$config['token'] ?: false;
$config['project']       = @$config['project'] ?: false;
$config['closed']        = @$config['closed'] ?: false;
$config['milestone']     = @$config['milestone'] ?: null;
$config['output']        = @$config['output'] ?: null;
$config['hoursPerDay']   = @$config['hoursPerDay'] ?: 8;
$config['columns']       = @$config['columns'] ?: ['iid', 'title', 'estimation'];
$config['dateFormat']    = @$config['dateFormat'] ?: 'd.m.Y H:i';
$config['excludeLabels'] = @$config['excludeLabels'] ?: [];
$config['includeLabels'] = @$config['includeLabels'] ?: [];

// Add some Collection magic
include 'Collection/macros.php';

// Create GitLab Client
$client = new Gitlab\Client($config['url']);
$client->authenticate($config['token'], Gitlab\Client::AUTH_URL_TOKEN);

// Setup and run application
$application = new Symfony\Component\Console\Application();
$application->add(new kriskbx\gtt\Commands\Login($configFile));
$application->add(new kriskbx\gtt\Commands\Edit($configFile));
$application->add(new kriskbx\gtt\Commands\ReportProject($client, $config));
$application->add(new kriskbx\gtt\Commands\ReportMonth($client, $config));
$application->add(new kriskbx\gtt\Commands\ReportDay($client, $config));
$application->run();