  let dalleData;
  // Example POST method implementation:
  async function postData(url = '') {
    try {
      const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: dalleData // body data type must match "Content-Type" header
      });
      console.log("print: " + response);
      return response.json();
    }
    catch(err) {
      console.log("BOAFBFEABFIAEB");
      console.log(err)
      return "error"
    }
  }
  /*
  postData('https://api.openai.com/v1/images/generations')
    .then((data) => {
      console.log(data["data"][0]); // JSON data parsed by `data.json()` call
    });
    */