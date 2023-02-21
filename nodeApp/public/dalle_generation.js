  let dalleData;
  // Example POST method implementation:
  async function postData(url = '') {
    // Default options are marked with *
    const response = await fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: dalleData // body data type must match "Content-Type" header
    });
    if(response.ok){
      return response.json(); // parses JSON response into native JavaScript objects
    } else {
      return "error"
    }
  }
  /*
  postData('https://api.openai.com/v1/images/generations')
    .then((data) => {
      console.log(data["data"][0]); // JSON data parsed by `data.json()` call
    });
    */