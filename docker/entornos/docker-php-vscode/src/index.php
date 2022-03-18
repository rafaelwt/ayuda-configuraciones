<?php
require_once('persona.php');

// Autoload files using the Composer autoloader.
require_once __DIR__ . '/vendor/autoload.php';

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

// echo phpinfo();
$var = "Hello World";
echo $var;
echo "<br>";

$client = new Client([
    'base_uri' => 'https://jsonplaceholder.typicode.com',
  ]);
  

  
  $response = $client->get('posts');
  
  $body = $response->getBody();
  print_r(json_decode((string) $body));