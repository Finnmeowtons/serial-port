class UserDevice {
    constructor(id, user_id, device_id, name, profile_picture_url) {
      this.id = id;
      this.user_id = user_id;
      this.device_id = device_id;
      this.name = name;
      this.profile_picture_url = profile_picture_url;
    }
  }
  
  module.exports = UserDevice;
  