# Wireframe Screen Reference — ODOO Carpooling Mockup

Extracted from `Carpooling_Platform_-_24_hours.excalidraw`. Commit to `docs/wireframe/`.
Screen names here match PRD §7. This is the structural base; styling comes from our design tokens.


## Auth & onboarding

- **Splash Screen**
- **Login** — Allows registered employees to securely access the Enterprise Carpooling Platform.
- **Login Button** — Validates user credentials and redirects to the Dashboard upon successful login.
- **Sign Up**
- **Registration Form**
- **Create New Account** — Redirects new users to the Sign Up page to register a new account.
- **Email / Mobile** — Enter the registered email address or mobile number.
- **Password** — Enter the account password to authenticate.
- **Name**
- **Phone**
- **Profile Photo**
- **Platform Branding**
- **Application Header** — Displays the platform branding and provides access to the user profile.

## Find a Ride

- **Find Ride** — Allows users to search for rides based on their travel requirements.
- **Find Ride Button** — Searches for rides matching the entered travel details.
- **Start Location** — Specify the pickup location where the journey begins.
- **Destination Location** — Specify the destination where the user wants to travel.
- **Swap Locations** — Interchange the pickup and destination locations with a single click.
- **Route Information** — Displays the selected pickup and destination locations for verification.
- **Route Preview** — Shows the calculated route on an interactive map.
- **Date & Time** — Select the preferred travel date and departure time.
- **Seat Requirement** — Choose the number of seats required for the journey.
- **Recurring Ride** — Search for rides on selected weekdays using a recurring schedule.
- **Confirm** — Confirms the displayed route and proceeds to the next step.
- **Available Rides** — Displays all rides matching the selected travel route and schedule.
- **Ride Details** — Shows the driver's information, route, departure time, fare per seat, and available seats.
- **Book Now** — Confirms the selected ride and adds it to My Trips.
- **Refresh** — Reloads the available rides to display the latest matching results.
- **More Options** — Provides additional ride-related actions such as viewing ride details or reporting an issue.

## Offer a Ride

- **Offer Ride** — Allows users to publish rides for other employees.
- **Available Seats** — Specify the number of seats available for passengers.
- **Fare Per Seat** — Displays the fare charged per passenger and the remaining available seats.
- **Publish Ride** — Publishes the ride, making it available for booking.

## Trip, tracking & chat

- **Track Ride** — Displays the current trip and allows users to monitor the journey in real time.
- **Trip Information** — Shows the pickup location, destination, driver details, and assigned vehicle information.
- **Trip Details** — Displays complete information about the booked ride, including driver, vehicle, route, and schedule.
- **Trip Summary** — Displays the completed trip information, including route, schedule, and fare.
- **Live Route** — Displays the vehicle's current location and travel route on the interactive map.
- **ETA** — Shows the estimated arrival time and trip progress.
- **Pickup & Drop Points** — Shows the confirmed boarding and destination locations.
- **Driver Information** — Shows the assigned driver's details for the booked ride.
- **Vehicle Information** — Displays the assigned vehicle details used for the trip.
- **Fare Details** — Displays the total fare to be paid for the completed journey.
- **Chat with Driver** — Allows passengers to communicate with the driver for trip-related updates.
- **Call to Driver** — Initiates a phone call for quick coordination before or during the trip.
- **Pay Now** — Redirects users to the payment module to complete the ride payment.

## Payments & wallet

- **Payment Method** — Allows users to choose their preferred payment option for the completed trip.
- **Payment Options** — Supports payment through Cash, Card, UPI, or Wallet.
- **Pay Button** — Initiates the payment process and completes the ride transaction.
- **Wallet Balance** — Displays the current available wallet balance.
- **Recharge Amount** — Specify the amount to be added to the wallet.
- **Recharge Method** — Select Card or UPI as the preferred payment method.
- **UPI Payment** — Allows users to pay using a UPI ID or by scanning the QR code.
- **Add Money** — Adds the specified amount to the wallet upon successful payment.

## Vehicles

- **My Vehicle** — Displays all vehicles registered by the user for ride sharing.
- **Add Vehicle** — Allows users to register a new vehicle before publishing rides.
- **Manage Vehicle** — Update or remove registered vehicle information whenever required.
- **Vehicle Details** — Shows the vehicle model, registration number, and assigned driver role.
- **Vehicle Status** — Indicates whether a registered vehicle is approved or inactive for ride sharing.

## History, reports, settings

- **Ride History** — Displays a record of all completed rides.
- **Trip Record** — Allows users to review their previous journeys for future reference.
- **Reports** — Displays insights into travel activity, vehicle usage, and transportation costs.
- **Key Metrics** — Shows summary statistics such as total fuel cost, profit, and vehicle utilization.
- **Analytics Charts** — Visualizes fuel efficiency trends and vehicle-wise cost analysis.
- **Financial Summary** — Provides a monthly overview of revenue, fuel expenses, maintenance costs, and net profit.
- **Settings** — Provides quick access to frequently used features and account preferences.
- **Quick Access** — Navigate to My Trips, My Vehicle, Payment Methods, Ride History, Saved Places, Help, and Chat from a single location.
- **Saved Places** — Store frequently used pickup and destination locations for faster ride booking and publishing.
- **Help & Chat** — Access support resources and communicate regarding application or trip-related queries.

## Admin console

- **Employees** — Displays all employees registered under the organization.
- **Employee Details** — Shows employee information such as name, email, department, manager, and office location.
- **Add Employee** — Registers a new employee and grants access to the platform.
- **Platform Access** — Indicates whether an employee has active or revoked access to the carpooling platform.
- **Registered Vehicles** — Displays all vehicles registered by employees within the organization.
- **Company Details** — Configure organization information such as company name, registered office, industry, contact information, and total registered employees.
- **Carpooling Configuration** — Define organization-wide settings such as fuel cost per litre, travel cost per kilometer, and the default carpooling policy.
- **Save Settings** — Saves all organization and carpooling configuration changes.
