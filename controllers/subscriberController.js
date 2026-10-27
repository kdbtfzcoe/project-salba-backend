const supabase = require('../config/db');

exports.createSubscriber = async (req, res) => {
    try {
        const { name, phone, mobile, address, latitude, longitude } = req.body;
        const targetPhone = phone || (mobile ? `+63${mobile}` : null);

        const { data, error } = await supabase
            .from('subscribers')
            .insert([
                {
                    name: name || 'Anonymous',
                    phone: targetPhone,
                    address: address || null,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null
                }
            ])
            .select();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ message: 'Mobile Number already exists. Try again' });
            }
            return res.status(500).json({ message: error.message });
        }

        return res.status(201).json({ 
            success: true, 
            message: 'Subscriber registered successfully', 
            data: data && data.length > 0 ? data[0] : null 
        });
    } catch (err) {
        console.error('[Subscriber Controller Error]:', err.message);
        return res.status(500).json({ message: err.message || 'Server error' });
    }
};