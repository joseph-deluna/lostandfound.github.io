<?php
    require_once('../connection.php');
    include('../function.php');
    if (!isAdmin()) {
	$_SESSION['msg'] = "You must log in first";
	header('location: ../login.php');
}

if (isset($_GET['logout'])) {
	session_destroy();
	unset($_SESSION['user']);
	header("location: ../login.php");
}
?>
<html lang="en">

<head>
    <!-- Required meta tags-->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="au theme template">
    <meta name="author" content="Hau Nguyen">
    <meta name="keywords" content="au theme template">

    <!-- Title Page-->
    <title>Reports</title>

    <!-- Fontfaces CSS-->
    <link href="./css/font-face.css" rel="stylesheet" media="all">
    <link href="./vendor/font-awesome-4.7/css/font-awesome.min.css" rel="stylesheet" media="all">
    <link href="./vendor/font-awesome-5/css/fontawesome-all.min.css" rel="stylesheet" media="all">
    <link href="./vendor/mdi-font/css/material-design-iconic-font.min.css" rel="stylesheet" media="all">

    <!-- Bootstrap CSS-->
    <link href="./vendor/bootstrap-4.1/bootstrap.min.css" rel="stylesheet" media="all">

    <!-- Vendor CSS-->
    <link href="./vendor/animsition/animsition.min.css" rel="stylesheet" media="all">
    <link href="./vendor/bootstrap-progressbar/bootstrap-progressbar-3.3.4.min.css" rel="stylesheet" media="all">
    <link href="./vendor/wow/animate.css" rel="stylesheet" media="all">
    <link href="./vendor/css-hamburgers/hamburgers.min.css" rel="stylesheet" media="all">
    <link href="./vendor/slick/slick.css" rel="stylesheet" media="all">
    <link href="./vendor/select2/select2.min.css" rel="stylesheet" media="all">
    <link href="./vendor/perfect-scrollbar/perfect-scrollbar.css" rel="stylesheet" media="all">

    <!-- Main CSS-->
    <link href="./css/theme.css" rel="stylesheet" media="all">

</head>

<body class="animsition">
    <div class="page-wrapper">
        <!-- HEADER MOBILE-->
        <header class="header-mobile d-block d-lg-none">
            <div class="header-mobile__bar">
                <div class="container-fluid">
                    <div class="header-mobile-inner">
                        <a class="logo" href="dashboard.php">
                            <img src="images/icon/uc.jpg" alt="uc log" />
                        </a>
                        <button class="hamburger hamburger--slider" type="button">
                            <span class="hamburger-box">
                                <span class="hamburger-inner"></span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            <nav class="navbar-mobile">
                <div class="container-fluid">
                    <ul class="navbar-mobile__list list-unstyled">
                        <li class="has-sub">
                            <a class="js-arrow" href="#">
                                <i class="fas fa-tachometer-alt"></i>Dashboard</a>
                        </li>
                        <li>
                            <a href="#">
                                <i class="fas fa-chart-bar"></i>Reports</a>
                        </li>
                        <li>
                            <a href="#">
                                <i class="fas fa-table"></i>Inventory</a>
                        </li>
                        <li>
                            <a href="#">
                                <i class="far fa-check-square"></i>Matches</a>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
        <!-- END HEADER MOBILE-->

        <!-- MENU SIDEBAR-->
        <aside class="menu-sidebar d-none d-lg-block">
            <div class="logo">
                <a href="dashboard.php">
                    <img src="./images/icon/uc.jpg" alt="uc" />
                </a>
            </div>
            <div class="menu-sidebar__content js-scrollbar1">
                <nav class="navbar-sidebar">
                    <ul class="list-unstyled navbar__list">
                        <li class="active has-sub">
                            <a class="js-arrow" href="dashboard.php">
                                <i class="fas fa-tachometer-alt"></i>Dashboard</a>
                        </li>
                        <li>
                            <a href="reports.php">
                                <i class="fas fa-chart-bar"></i>Reports</a>
                        </li>
                        <li>
                            <a href="inventory.php">
                                <i class="fas fa-table"></i>Inventory</a>
                        </li>
                        <li>
                            <a href="#">
                                <i class="far fa-check-square"></i>Matches</a>
                        </li>
                    </ul>
                </nav>
            </div>
        </aside>
        <!-- END MENU SIDEBAR-->

        <!-- PAGE CONTAINER-->
        <div class="page-container">
            <!-- HEADER DESKTOP-->
            <header class="header-desktop">
                <div class="section__content section__content--p30">
                    <div class="container-fluid">
                        <div class="header-wrap">
                          <!-- Search bar -->
                            <form class="form-header" action="" method="POST">
                                <input class="au-input au-input--xl" type="text" name="search" placeholder="Search for datas &amp; reports..." />
                                <button class="au-btn--submit" type="submit">
                                    <i class="zmdi zmdi-search"></i>
                                </button>
                            </form>

                            <div class="header-button">

                                <div class="account-wrap">
                                    <div class="account-item clearfix js-item-menu">
                                        <div class="image">
                                            <img src="images/icon/admin.jpg" alt="John Doe" />
                                        </div>
                                        <div class="content">
                                            <a class="js-acc-btn" href="#"><strong><?php echo $_SESSION['user']['username']; ?></strong></a>
                                        </div>
                                        <div class="account-dropdown js-dropdown">
                                            <div class="info clearfix">
                                                <div class="image">
                                                    <a href="#">
                                                        <img src="images/icon/admin.jpg" alt="admin" />
                                                    </a>
                                                </div>
                                                <div class="content">
                                                    <h5 class="name">
                                                        <strong><?php echo $_SESSION['user']['username']; ?></strong>
                                                    </h5>
                                                    <i  style="color: #888;">(<?php echo ucfirst($_SESSION['user']['user_type']); ?>)</i>
                                                </div>
                                            </div>

                                            <div class="account-dropdown__footer">
                                                <a href="dashboard.php?logout='1'">
                                                    <i class="zmdi zmdi-power"></i>Logout</a>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <!-- HEADER DESKTOP-->

            <!-- MAIN CONTENT-->
            <div class="main-content">
                <div class="section__content section__content--p30">
                    <div class="container-fluid">


                      <div class="col-lg-12">
                          <div class="table-responsive table--no-card m-b-30">
                            <a href="add_item.php"><button type="button" class="btn btn-success">Add Item</button></a>
                              <table class="table table-borderless table-striped table-earning">
                                  <thead>
                                      <tr>

                                          <th>Item Name</th>
                                          <th>Location Lost</th>
                                          <th>Description</th>
                                          <th class="text-right">Reported By</th>
                                          <th class="text-right">Contact</th>
                                          <th class="text-right">Email Address</th>
                                          <th>Date Lost</th>
                                          <th class="text-right">Actions</th>

                                      </tr>
                                  </thead>
                                  <tbody>
                                    <?php
                                    if(isset($_POST['search'])) {
                                      $searchq = $_POST['search'];
                                      $searchq = preg_replace("#[^0-9a-z]#i","",$searchq);
                                    $sql = "SELECT * FROM reports WHERE iname LIKE '%$searchq%' OR description LIKE '%$searchq%'";
                                    $result = $connect->query($sql);

                                    if($result->num_rows > 0) {
                                      while($row = $result->fetch_assoc()) {
                                        echo "<tr>

                                        <td>".$row['iname']."</td>
                                        <td>".$row['location']."</td>
                                        <td>".$row['description']."</td>
                                        <td>".$row['fname']."
                                        ".$row['lname']."</td>
                                        <td>".$row['contact']."</td>
                                        <td>".$row['email']."</td>
                                        <td>".$row['created_at']."</td>
                                        <td>
                                        <a href='update.php?id=".$row['id']."'><button type='button'>Edit</button></a>
                                        <a href='delete.php?id=".$row['id']."'><button type='button'>Remove</button></a>
                                        </td>
                                        </tr>";
                                      }
                                    } else {
                                      echo "<tr><td colspan='5'><center>No Data Avaliable</center></td></tr>";
                                    }
                                  }
                                    ?>
                                  </tbody>
                              </table>
                          </div>
                      </div>




                    </div>
                </div>
            </div>
            <!-- END MAIN CONTENT-->
            <!-- END PAGE CONTAINER-->
        </div>

    </div>

    <!-- Jquery JS-->
    <script src="./vendor/jquery-3.2.1.min.js"></script>
    <!-- Bootstrap JS-->
    <script src="./vendor/bootstrap-4.1/popper.min.js"></script>
    <script src="./vendor/bootstrap-4.1/bootstrap.min.js"></script>
    <!-- Vendor JS       -->
    <script src="./vendor/slick/slick.min.js">
    </script>
    <script src="./vendor/wow/wow.min.js"></script>
    <script src="./vendor/animsition/animsition.min.js"></script>
    <script src="./vendor/bootstrap-progressbar/bootstrap-progressbar.min.js">
    </script>
    <script src="./vendor/counter-up/jquery.waypoints.min.js"></script>
    <script src="./vendor/counter-up/jquery.counterup.min.js">
    </script>
    <script src="./vendor/circle-progress/circle-progress.min.js"></script>
    <script src="./vendor/perfect-scrollbar/perfect-scrollbar.js"></script>
    <script src="./vendor/chartjs/Chart.bundle.min.js"></script>
    <script src="./vendor/select2/select2.min.js">
    </script>

    <!-- Main JS-->
    <script src="./js/main.js"></script>

</body>

</html>
<!-- end document-->
