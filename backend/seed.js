require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        // Clean existing users with these emails
        await User.deleteMany({ email: { $in: ['student@demo.com', 'organizer@demo.com'] } });

        // Seed demo users
        const users = [
            {
                name: 'Demo Student',
                email: 'student@demo.com',
                password: 'demo123',
                role: 'student'
            },
            {
                name: 'Demo Organizer',
                email: 'organizer@demo.com',
                password: 'demo123',
                role: 'organizer'
            }
        ];

        for (const user of users) {
            const newUser = new User(user);
            await newUser.save();
            console.log(`✅ Seeded: ${user.email}`);
        }

        console.log('🎉 Demo users seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
};

seedDB();
