module.exports = {
  sellerLogin: function (context, events, done) {
    const phoneNo = `017${Math.floor(10000000 + Math.random() * 90000000)}`

    // First send OTP
    context.vars.otpPhone = phoneNo

    events.emit(
      'post',
      '/api/v1/auth/send-otp',
      {
        phoneNo: phoneNo,
      },
      (err, response) => {
        if (err || response.statusCode !== 200) {
          return done()
        }

        // Then verify OTP and login
        events.emit(
          'post',
          '/api/v1/auth/verify-otp',
          {
            phoneNo: phoneNo,
            otp: '123456', // Mock OTP for testing
            verificationId: response.body.data.verificationId,
          },
          (err, response) => {
            if (err || response.statusCode !== 200) {
              return done()
            }

            context.vars.sellerToken = response.body.data.token

            // Complete seller registration if needed
            events.emit(
              'post',
              '/api/v1/auth/seller',
              {
                name: `Test Seller ${Math.floor(1000 + Math.random() * 9000)}`,
                shopName: `Test Shop ${Math.floor(100 + Math.random() * 900)}`,
                shopAddress: `Shop Address ${Math.floor(100 + Math.random() * 900)}`,
                zilla: 'Dhaka',
                upazilla: 'Mirpur',
                nidNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
              },
              {
                headers: {
                  Authorization: `Bearer ${context.vars.sellerToken}`,
                },
              },
              err => {
                done()
              },
            )
          },
        )
      },
    )
  },

  adminLogin: function (context, events, done) {
    // Mock admin login - in real scenario, use actual admin credentials
    context.vars.adminToken = 'mock-admin-token-for-testing'
    done()
  },

  randomNumber: function (digits) {
    return Math.floor(
      Math.pow(10, digits - 1) + Math.random() * 9 * Math.pow(10, digits - 1),
    ).toString()
  },

  randomInt: function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },
}
