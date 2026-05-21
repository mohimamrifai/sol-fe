IDNVerse Karya Nusantara
PROJECT BRIEF
SOL
Multimodal Logistics Booking & Shipment Management Platform
1. Project Overview
Platform ini adalah web-based logistics platform untuk mengelola pengiriman barang
menggunakan berbagai moda transportasi.
Platform ditujukan untuk:
• Customer B2B (perusahaan)
• Customer B2C (perorangan – future expansion)
Sistem memungkinkan customer untuk:
• membuat booking pengiriman
• melakukan tracking shipment
• melihat invoice
• melakukan pembayaran online
Semua proses operasional akan dikelola melalui internal admin system.
2. Initial Operational Scope (MVP)
Pada tahap pertama, sistem hanya fokus pada:
• Transport Mode: Rail Cargo
• Service Type:
o FCL (Full Container Load)
o LCL (Less Container Load)
• Shipment Coverage:
o Port → Port
o Door → Port (future expansion)
o Port → Door (future expansion)
o Door → Door (future expansion)
Namun sistem harus dirancang agar mudah dikembangkan untuk moda lain di masa depan,
seperti:
• Trucking
• Sea Freight
• Air Cargo
3. Target Users
a. Internal Team
Digunakan oleh tim perusahaan untuk mengelola operasional.
Roles:
- Admin
- Operations
- Finance
IDNVerse Karya Nusantara
- Sales
Fungsi utama:
• manage customer
• manage booking
• manage shipment
• generate invoice
• manage payment
b. Customer (Company)
Perusahaan yang menggunakan layanan pengiriman.
Roles dalam company:
- Company Admin
- Operations PIC
- Finance PIC
Fungsi:
• membuat booking
• melihat shipment
• tracking cargo
• melihat invoice
• melakukan pembayaran
4. Core Business Flow
a. Customer Registration
Customer dapat membuat akun perusahaan dengan mengisi:
- Company Name
- NPWP
- NIB
- Address
- Contact Person
- Email
- Phone
Account akan direview oleh internal admin sebelum aktif.
Alternatif:
Sales dapat membuat akun customer langsung dari internal system.j
b. Booking Shipment
Customer membuat booking pengiriman.
Informasi booking:
- Origin Location
- Destination Location
- Shipment Type (Port)
- Service Type (FCL / LCL)
- Container Size (20ft / 40ft) – for FCL
- Gross Weight – for LCL
IDNVerse Karya Nusantara
- Cargo Description
- Pickup Date
- Additional Services (optional)
Sistem akan menampilkan estimated price sebelum booking dikirim.
c. Shipment Creation
Setelah booking disetujui oleh operations: Booking → Shipment
Shipment akan memiliki:
- Shipment ID
- Waybill Number
- Container Info
- Shipment Items
d. Shipment Item Management
Setiap shipment dapat memiliki multiple cargo items.
Contoh:
Shipment: WB-0001
Items:
- Item A – 10 box electronics
- Item B – 5 pallet spareparts
- Item C – machinery crate
Data setiap item:
- Item Name
- Description
- Quantity
- Gross Weight
- Dimensions (L/W/H)
- CBM
- Fragile (Yes/No)
- Stackable (Yes/No)
e. LCL Rack Management
Untuk shipment LCL, barang dapat ditempatkan dalam rack container system.
Contoh ukuran rack:
110 cm x 110 cm x 200cm
Struktur container:
Container
• Rack A
o Item 1
o Item 2
• Rack B
o Item 3
Tujuan rack:
- memudahkan pengelompokan barang
IDNVerse Karya Nusantara
- memudahkan pencarian saat unloading
f. Flexible Cargo Placement
Tidak semua cargo dapat dimasukkan ke rack.
Cargo besar seperti:
- pallet besar
- machinery
- oversized cargo
dapat ditempatkan langsung di floor container.
Placement type:
- Rack
- Floor Container
g. Additional Services
Saat booking, customer dapat memilih layanan tambahan.
Contoh:
Pickup Service
- pickup address
- pickup date
- contact person
Packing Service
- palletizing
- wooden crate
- bubble wrap
- reboxing
Handling Service
- forklift handling
- fragile handling
- heavy cargo handling
h. Shipment Tracking
Setiap shipment memiliki status timeline.
Contoh status:
- Booking Created
- Survey Completed
- Cargo Received
- Stuffing Container
- Container Sealed
- Train Departed
- Train Arrived
- Container Unloading
- Ready for Pickup
- Completed
Setiap step dapat:
- upload photos
IDNVerse Karya Nusantara
- add notes
- timestamp
i. Public Shipment Tracking
Shipment dapat ditrack menggunakan:
Waybill Number
Tracking page dapat diakses tanpa login.
Informasi yang ditampilkan:
- Shipment Status
- Timeline
- Photos
- Origin
- Destination
- Estimated Arrival
j. Billing & Invoice
Invoice dibuat per shipment.
Billing cycle perusahaan:
- 1 – 15
- 16 – End of Month
- 1 – 15 & 16 – End of Month
- End of Month
Namun invoice tetap dibuat per shipment, bukan digabung.
Customer dapat membayar invoice secara terpisah.
Invoice status:
- Unpaid
- Paid
- Overdue
Jika customer memiliki invoice overdue, customer tidak dapat membuat booking baru.
k. Payment
Payment dilakukan melalui Payment Gateway Midtrans.
Metode pembayaran:
- Virtual Account
- Bank Transfer
- QRIS
- Credit Card
Customer dapat:
- Pay Now (langsung bayar)
- Pay Later (bayar sebelum due date)
Payment status akan diupdate otomatis melalui Midtrans callback.
l. Internal Admin Modules
1) Customer Management
Mengelola data customer.
Fitur:
IDNVerse Karya Nusantara
- Company Management
- Branch Management
- User Management
- Customer Activation
2) Booking Management
Mengelola permintaan booking dari customer.
Fitur:
- view booking
- approve / reject booking
- convert booking to shipment
3) Shipment Management
Mengelola seluruh proses pengiriman.
Fitur:
- shipment details
- container management
- rack assignment
- cargo items management
- shipment status tracking
- photo upload
4) Invoice Management
Mengelola invoice customer.
Fitur:
- generate invoice
- download invoice PDF
- view invoice status
5) Payment / AR Management
Mengelola pembayaran invoice.
Fitur:
- payment monitoring
- midtrans payment integration
- invoice payment status
- overdue monitoring
6) Master Operational
Master data untuk operasional.
- Locations
- Transport Modes
- Service Types
- Container Types
- Additional Services
7) Vendor & Pricing
Mengelola vendor transportasi dan pricing.
- Vendor
IDNVerse Karya Nusantara
- Vendor Services
- Buy Price
- Selling Price
- Customer Discount
m. Customer Portal
Customer portal menyediakan halaman berikut:
- Dashboard
- Create Booking
- My Shipments
- Shipment Tracking
- Invoices
- Payments
- Company Settings
n. Key Integrations
Payment Gateway
Midtrans
Digunakan untuk:
- invoice payment
- payment confirmation
- payment status callback
o. Expected Deliverables
Developer diharapkan menyediakan:
- Internal Admin Web System
- Customer Portal
- Multimodal Route Engine
- Public Tracking Page
- Payment Integration (Midtrans)
- Invoice PDF Generation
- Waybill PDF Generation
- Responsive Web Interface
p. Suggested Technology Stack
- Frontend: React
- Backend: Laravel
- Database: MySQL
- Hosting: Alibaba Cloud
Cloud server, domain, midtrans, repository github, kami yang sediakan.