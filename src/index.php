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

// Config
$config = new \kriskbx\gtt\Config\Config();
$configFile = \kriskbx\gtt\Config\Config::getFile();

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