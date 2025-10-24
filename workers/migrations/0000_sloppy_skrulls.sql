CREATE TABLE `brands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`company_name` text NOT NULL,
	`industry` text,
	`website` text,
	`logo_url` text,
	`description` text,
	`total_campaigns` integer DEFAULT 0,
	`is_verified` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `campaign_agreements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`brand_id` text NOT NULL,
	`creator_id` text NOT NULL,
	`price_offered` real,
	`final_price` real,
	`deadline` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`invitation_type` text NOT NULL,
	`custom_terms` text,
	`custom_clauses` text,
	`template_clauses` text,
	`application_message` text,
	`portfolio_links` text,
	`delivery_days` integer,
	`additional_notes` text,
	`portfolio_files` text,
	`payment_status` text DEFAULT 'PENDING' NOT NULL,
	`revision_count` integer DEFAULT 0,
	`max_revisions` integer DEFAULT 2,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`finalized_at` integer,
	`expires_at` integer,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`brand_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`budget` real,
	`price_per_ugc` real,
	`content_type` text,
	`video_duration` integer,
	`start_date` integer,
	`deadline` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`category` text DEFAULT 'other',
	`difficulty` text DEFAULT 'intermediate',
	`requirements` text,
	`target_audience` text,
	`language` text,
	`platforms` text,
	`product_name` text,
	`product_link` text,
	`delivery_method` text,
	`media_files` text,
	`additional_notes` text,
	`max_creators` integer DEFAULT 10,
	`current_creators` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`negotiation_id` integer NOT NULL,
	`brand_id` text NOT NULL,
	`creator_id` text NOT NULL,
	`terms` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`signed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`negotiation_id`) REFERENCES `negotiations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`brand_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agreement_id` integer NOT NULL,
	`brand_id` text NOT NULL,
	`creator_id` text NOT NULL,
	`last_message_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agreement_id`) REFERENCES `campaign_agreements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`brand_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `creators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`specialization` text,
	`portfolio_url` text,
	`instagram_handle` text,
	`tiktok_handle` text,
	`youtube_handle` text,
	`followers_count` integer DEFAULT 0,
	`rating` real DEFAULT 0,
	`completed_campaigns` integer DEFAULT 0,
	`is_verified` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `gigs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creator_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`price` real NOT NULL,
	`category` text NOT NULL,
	`tags` text,
	`portfolio_urls` text,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` integer NOT NULL,
	`sender_id` text NOT NULL,
	`content` text NOT NULL,
	`message_type` text DEFAULT 'text' NOT NULL,
	`is_read` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `negotiations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gig_id` integer NOT NULL,
	`brand_id` text NOT NULL,
	`creator_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`proposed_price` real,
	`proposed_deadline` integer,
	`message` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`gig_id`) REFERENCES `gigs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`brand_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agreement_id` integer NOT NULL,
	`brand_id` text NOT NULL,
	`creator_id` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'MAD' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`stripe_payment_intent_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agreement_id`) REFERENCES `campaign_agreements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`brand_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`stripe_payment_intent_id` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text NOT NULL,
	`avatar_url` text,
	`phone` text,
	`bio` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`creator_id` text NOT NULL,
	`agreement_id` integer,
	`video_url` text NOT NULL,
	`r2_key` text NOT NULL,
	`file_size` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`feedback` text,
	`submitted_at` integer DEFAULT (unixepoch()) NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agreement_id`) REFERENCES `campaign_agreements`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`pending_balance` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'MAD' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wallets_user_id_unique` ON `wallets` (`user_id`);