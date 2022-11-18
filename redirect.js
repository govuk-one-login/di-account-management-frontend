exports.handler = async (event) => {

  const response = {
    statusCode: 301,
    headers: {
      "Location": process.env.REDIRECT_URL + event.path,
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload"
    }
  };
  return response;
};
