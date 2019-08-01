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
    
    <meta charset="UTF-8">
    <!-- Title Page-->
    <title>Reports</title>

    <!-- Fontfaces CSS-->
    
    <link href="./vendor/font-awesome-4.7/css/font-awesome.min.css" rel="stylesheet" media="all">
    <link href="./vendor/font-awesome-5/css/fontawesome-all.min.css" rel="stylesheet" media="all">
    <link href="./vendor/mdi-font/css/material-design-iconic-font.min.css" rel="stylesheet" media="all">

    <!-- Bootstrap CSS-->
    <link href="./vendor/bootstrap-4.1/bootstrap.min.css" rel="stylesheet" media="all">

    <!-- Vendor CSS-->
    <link href="./vendor/animsition/animsition.min.css" rel="stylesheet" media="all">

    <!-- Main CSS-->
    <link href="./css/theme.css" rel="stylesheet" media="all">

</head>

<body class="animsition">
    <div class="page-wrapper">

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
                        <li>
                            <a class="js-arrow" href="dashboard.php">
                                <i class="fas fa-tachometer-alt"></i>Dashboard</a>
                        </li>
                        <li class="active has-sub">
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
                            <form class="form-header" action="reports_search.php" method="POST">
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
                                    $sql = "SELECT * FROM reports WHERE active = 1";
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
                                    ?>
                                  </tbody>
                              </table>
                          </div>
                      </div>




                    </div>
                </div>
            </div>
        </div>

    </div>

    <!-- Jquery JS-->
    <script src="./vendor/jquery-3.2.1.min.js"></script>
    <!-- Bootstrap JS-->
    <script src="./vendor/bootstrap-4.1/popper.min.js"></script>
    <script src="./vendor/bootstrap-4.1/bootstrap.min.js"></script>
    <!-- Vendor JS       -->
    <script src="./vendor/animsition/animsition.min.js"></script>

    <!-- Main JS-->
    <script src="./js/main.js"></script>

</body>

</html>
<!-- end document-->
