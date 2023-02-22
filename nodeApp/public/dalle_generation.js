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