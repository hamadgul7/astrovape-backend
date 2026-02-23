const mongoose = require('mongoose');
async function connectToDatabase() {
    try {
      await mongoose.connect(
        `mongodb+srv://${encodeURIComponent(process.env.MONGO_USER)}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
      );

      console.log('Connected to the database successfully!');
    } catch (error) {
      console.error('Failed to connect to the database:', error);
    }
}

module.exports = { connectToDatabase };
