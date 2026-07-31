import { Guest } from '../../models/Guest.js';
import { User } from '../../models/User.js';

export const listGuests = async (req, res) => {
  try {
    const guests = await Guest.find().populate('userId');
    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateGuest = async (req, res) => {
  try {
    const { partySize, luggageCount } = req.body;
    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      { partySize, luggageCount },
      { new: true }
    ).populate('userId');
    
    if (!guest) return res.status(404).json({ message: 'Guest not found' });
    res.json(guest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
