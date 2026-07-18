CREATE TYPE "public"."platform_access" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'company_admin', 'employee');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending', 'active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'success', 'warning', 'error');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."vehicle_approval_status" AS ENUM('approved', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."ride_status" AS ENUM('published', 'full', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('booked', 'started', 'in_progress', 'completed', 'payment_pending', 'payment_completed');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'upi', 'wallet');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."demo_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"allowed_email_domains" text[] DEFAULT '{}' NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"fuel_cost_per_km" numeric(10, 2) DEFAULT '0' NOT NULL,
	"travel_cost_per_km" numeric(10, 2) DEFAULT '0' NOT NULL,
	"maintenance_monthly" numeric(12, 2) DEFAULT '0' NOT NULL,
	"auto_approve_domain" boolean DEFAULT false NOT NULL,
	"settings" jsonb
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"phone" text,
	"password_hash" text,
	"role" "user_role" DEFAULT 'employee' NOT NULL,
	"status" "user_status" DEFAULT 'pending' NOT NULL,
	"platform_access" "platform_access" DEFAULT 'active' NOT NULL,
	"department" text,
	"manager" text,
	"office_location" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"resource" text,
	"resource_id" uuid,
	"read_at" timestamp with time zone,
	"is_read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid,
	"actor_id" uuid,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" uuid,
	"metadata" jsonb,
	"ip" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "system_setting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"category" text DEFAULT 'general' NOT NULL,
	"label" text,
	"description" text,
	CONSTRAINT "system_setting_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "support_ticket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid,
	"requester_id" uuid NOT NULL,
	"assignee_id" uuid,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"priority" "ticket_priority" DEFAULT 'medium' NOT NULL,
	"ride_id" uuid,
	"resource" text,
	"resource_id" uuid
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'employee' NOT NULL,
	"token" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "vehicle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"model" text NOT NULL,
	"registration_no" text NOT NULL,
	"seating_capacity" integer DEFAULT 4 NOT NULL,
	"approval_status" "vehicle_approval_status" DEFAULT 'inactive' NOT NULL,
	"registered_by_admin_id" uuid
);
--> statement-breakpoint
CREATE TABLE "ride" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"origin" jsonb NOT NULL,
	"destination" jsonb NOT NULL,
	"depart_at" timestamp with time zone NOT NULL,
	"seats_total" integer NOT NULL,
	"seats_available" integer NOT NULL,
	"fare_per_seat" numeric(10, 2) NOT NULL,
	"route_geojson" jsonb,
	"distance_km" numeric(10, 2),
	"duration_min" integer,
	"status" "ride_status" DEFAULT 'published' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_rule" text
);
--> statement-breakpoint
CREATE TABLE "booking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid NOT NULL,
	"ride_id" uuid NOT NULL,
	"passenger_id" uuid NOT NULL,
	"seats_booked" integer DEFAULT 1 NOT NULL,
	"pickup_point" jsonb,
	"drop_point" jsonb,
	"fare_amount" numeric(10, 2) NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_place" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"label" text NOT NULL,
	"lat" numeric(10, 7) NOT NULL,
	"lng" numeric(10, 7) NOT NULL,
	"address" text
);
--> statement-breakpoint
CREATE TABLE "trip" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid NOT NULL,
	"ride_id" uuid NOT NULL,
	"status" "trip_status" DEFAULT 'booked' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"driver_lat" numeric(10, 7),
	"driver_lng" numeric(10, 7),
	"eta_min" integer
);
--> statement-breakpoint
CREATE TABLE "trip_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" text
);
--> statement-breakpoint
CREATE TABLE "wallet_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"delta" numeric(12, 2) NOT NULL,
	"reason" text NOT NULL,
	"ref_id" uuid,
	"balance_after" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demo_entity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "demo_status" DEFAULT 'draft' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"due_date" timestamp with time zone,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"attachment_url" text
);
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_ride_id_ride_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."ride"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_registered_by_admin_id_user_id_fk" FOREIGN KEY ("registered_by_admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride" ADD CONSTRAINT "ride_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride" ADD CONSTRAINT "ride_driver_id_user_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride" ADD CONSTRAINT "ride_vehicle_id_vehicle_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicle"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_ride_id_ride_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."ride"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_passenger_id_user_id_fk" FOREIGN KEY ("passenger_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_place" ADD CONSTRAINT "saved_place_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_place" ADD CONSTRAINT "saved_place_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip" ADD CONSTRAINT "trip_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip" ADD CONSTRAINT "trip_ride_id_ride_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."ride"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_event" ADD CONSTRAINT "trip_event_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_event" ADD CONSTRAINT "trip_event_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_trip_id_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_payer_id_user_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_entry" ADD CONSTRAINT "wallet_entry_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_entry" ADD CONSTRAINT "wallet_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_entity" ADD CONSTRAINT "demo_entity_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_name_idx" ON "organization" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_org_idx" ON "user" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_status_idx" ON "user" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_user_unread_idx" ON "notification" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "activity_log_org_idx" ON "activity_log" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "activity_log_actor_idx" ON "activity_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "activity_log_resource_idx" ON "activity_log" USING btree ("resource","resource_id");--> statement-breakpoint
CREATE INDEX "activity_log_created_at_idx" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "system_setting_key_idx" ON "system_setting" USING btree ("key");--> statement-breakpoint
CREATE INDEX "system_setting_category_idx" ON "system_setting" USING btree ("category");--> statement-breakpoint
CREATE INDEX "support_ticket_org_idx" ON "support_ticket" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "support_ticket_requester_idx" ON "support_ticket" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "support_ticket_assignee_idx" ON "support_ticket" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "support_ticket_status_idx" ON "support_ticket" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_ticket_priority_idx" ON "support_ticket" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "support_ticket_ride_idx" ON "support_ticket" USING btree ("ride_id");--> statement-breakpoint
CREATE INDEX "invitation_org_idx" ON "invitation" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitation_token_idx" ON "invitation" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitation_status_idx" ON "invitation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vehicle_org_idx" ON "vehicle" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vehicle_owner_idx" ON "vehicle" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "vehicle_status_idx" ON "vehicle" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "ride_org_idx" ON "ride" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ride_driver_idx" ON "ride" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "ride_vehicle_idx" ON "ride" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "ride_status_idx" ON "ride" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ride_depart_idx" ON "ride" USING btree ("depart_at");--> statement-breakpoint
CREATE INDEX "booking_org_idx" ON "booking" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "booking_ride_idx" ON "booking" USING btree ("ride_id");--> statement-breakpoint
CREATE INDEX "booking_passenger_idx" ON "booking" USING btree ("passenger_id");--> statement-breakpoint
CREATE INDEX "booking_status_idx" ON "booking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "saved_place_org_idx" ON "saved_place" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "saved_place_user_idx" ON "saved_place" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trip_org_idx" ON "trip" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "trip_ride_idx" ON "trip" USING btree ("ride_id");--> statement-breakpoint
CREATE INDEX "trip_status_idx" ON "trip" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trip_event_org_idx" ON "trip_event" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "trip_event_trip_idx" ON "trip_event" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_event_at_idx" ON "trip_event" USING btree ("at");--> statement-breakpoint
CREATE INDEX "message_org_idx" ON "message" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "message_trip_idx" ON "message" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "message_sender_idx" ON "message" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "payment_org_idx" ON "payment" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "payment_booking_idx" ON "payment" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payment_payer_idx" ON "payment" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_intent_idx" ON "payment" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "wallet_entry_org_idx" ON "wallet_entry" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "wallet_entry_user_idx" ON "wallet_entry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_entry_created_idx" ON "wallet_entry" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "demo_entity_owner_idx" ON "demo_entity" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "demo_entity_status_idx" ON "demo_entity" USING btree ("status");--> statement-breakpoint
CREATE INDEX "demo_entity_name_idx" ON "demo_entity" USING btree ("name");--> statement-breakpoint
CREATE INDEX "demo_entity_created_at_idx" ON "demo_entity" USING btree ("created_at");