CREATE TABLE `users` (
`id` INT(10),
`username` VARCHAR(100),
`user_type` VARCHAR(100),
`password` VARCHAR(100));

CREATE TABLE `reports` (
`id` INT(11) NOT NULL AUTO_INCREMENT,
`iname` VARCHAR(100),
`location` VARCHAR(100),
`date` VARCHAR(100),
`fname` VARCHAR(100),
`lname` VARCHAR(100),
`contact` INT(11),
`description` VARCHAR(100),
`active` INT(11) NOT NULL DEFAULT '0',
`created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET= latin1 AUTO_INCREMENT=1;
