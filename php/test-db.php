<?php
// Your code here!
echo("Pagina en construccion");
$hostName = "localhost";
$dbName = "copaguas_web";
$userName = "copaguas_web";
$password = "C00p4gu4s";
try {
    $pdo = new PDO("mysql:host=$hostName;dbname=$dbName",$userName,$password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected successfully"; 
    }
    catch(PDOException $e)
    {
     echo "Connection failed: " . $e->getMessage();
    }

?>
