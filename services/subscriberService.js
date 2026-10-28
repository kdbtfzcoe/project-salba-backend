const supabase = require('../config/db');

exports.createSubscriber = async (userData) => {
    const { name, phone, mobile, address, latitude, longitude } = userData;
    const targetPhone = phone || mobile;

    const { data, error } = await supabase
        .from('recipients') //
        .insert([
            {
                full_name: name || 'Anonymous', //
                mobile_number: targetPhone,     //
                home_address: address || null,  //
                latitude: latitude ? parseFloat(latitude) : null,   //
                longitude: longitude ? parseFloat(longitude) : null //[cite: 1]
            }
        ])
        .select();

    if (error) {
        // PostgreSQL code 23505 = duplicate phone number / unique constraint
        if (error.code === '23505') {
            const dupErr = new Error('Mobile Number already exists. Try again');
            dupErr.statusCode = 400;
            throw dupErr;
        }
        throw new Error(error.message);
    }

    return data && data.length > 0 ? data[0].recipient_id : null; //[cite: 1]
};