// Function to get address from Firestore
const getAddress = async (userId) => {
    try {
      const userDoc = await firestore.collection('users').doc(userId).get();
      if (userDoc.exists) {
        return userDoc.data().address;
      } else {
        console.log('No such document!');
      }
    } catch (error) {
      console.error('Error getting address:', error.message);
    }
  };