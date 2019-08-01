<?php

require_once 'connection.php';

if($_POST) {
    $iname = $_POST['iname'];
    $location = $_POST['location'];
    $fname = $_POST['fname'];
    $lname = $_POST['lname'];
    $contact = $_POST['contact'];
    $description = $_POST['description'];

    $sql = "INSERT INTO reports (iname, location, fname, lname, contact, description, active)
     VALUES ('$iname', '$location', '$fname', '$lname', '$contact', '$description', 1)";

    $connect->close();
}

?>
