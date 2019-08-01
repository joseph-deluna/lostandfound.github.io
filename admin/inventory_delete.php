<?php

require_once('../function.php');

// get the 'id' variable from the URL
$id = $_GET['id'];

// delete record from database
$result=mysqli_query($mysqli, "DELETE FROM items WHERE id = $id");

// redirect user after delete is successful
header("Location: inventory.php");

?>
