CREATE TABLE `conversation_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer DEFAULT (unixepoch()) NOT NULL,
	`left_at` integer,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `message_reads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message_id` text NOT NULL,
	`user_id` text NOT NULL,
	`read_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
