export const fileFilter = (req: Express.Request, file: Express.Multer.File, callback: Function) => {
    if (!file) {
        return callback(new Error('File is empty'), false)
    }

    const validExtensions = ['jpg', 'jpeg', 'png'];
    const fileExtension = file.mimetype.split('/')[1];

    if (validExtensions.includes(fileExtension)) {
        return callback(null, true);
    }

    callback(null, false);

}