export const usersDB = [
  {
    email: "admin@example.com",
    password: "Admin@123456",
    role: "admin",
    requires2FA: true
  },
  {
    email: "super@example.com",
    password: "123456",
    role: "super_admin",
    requires2FA: false
  },
  {
    email: "dealer@example.com",
    password: "Dealer@123456",
    role: "dealer",
    dealership: "Premium Motors",
    requires2FA: true
  }
];

export const simulateDelay = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));
