jest.spyOn(console,"warn").mockImplementation((message: string)=>{
    if (message.includes("vueQueryConfig")) {
        return;
    } else {
        console.log(message)
    }
})