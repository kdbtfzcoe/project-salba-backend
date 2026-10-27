const supabase = require('../config/db');

exports.createSubscriber = async (userData) => {
    const { name, phone, mobile, address, latitude, longitude } = userData;
    const targetPhone = phone || mobile;

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
        // PostgreSQL code 23505 = duplicate phone number constraint
        if (error.code === '23505') {
            const dupErr = new Error('Mobile Number already exists. Try again');
            dupErr.statusCode = 400;
            throw dupErr;
        }
        throw new Error(error.message);
    }

    return data && data.length > 0 ? data[0].id : null;
};