
CREATE TABLE `cotton` (
  `id` varchar(38) NOT NULL,
  `userId` varchar(38) NOT NULL,
  `name` varchar(45) NOT NULL,
  `type` varchar(45) DEFAULT NULL,
  `stock` decimal(14,6) DEFAULT NULL,
  `state` int DEFAULT NULL,
  `stockState` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `deal` (
  `id` varchar(38) NOT NULL,
  `userId` varchar(38) NOT NULL,
  `cottonId` varchar(38) NOT NULL,
  `partyId` varchar(38) NOT NULL,
  `type` int NOT NULL,
  `unitPrice` decimal(14,6) NOT NULL,
  `quantity` decimal(14,6) NOT NULL,
  `comment` longtext,
  `businessDate` datetime NOT NULL,
  `createDate` datetime NOT NULL,
  `state` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `party` (
  `id` varchar(38) NOT NULL,
  `userId` varchar(38) NOT NULL,
  `name` varchar(80) NOT NULL,
  `state` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user` (
  `id` varchar(38) NOT NULL,
  `name` varchar(20) DEFAULT NULL,
  `accountId` varchar(45) NOT NULL,
  `password` varchar(1024) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accountId_UNIQUE` (`accountId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
