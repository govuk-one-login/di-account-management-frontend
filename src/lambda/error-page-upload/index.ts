import AWS from "aws-sdk";
const s3 = new AWS.S3();

export const handler = async (event: any): Promise<string> => {
  const bucketName: string = event.ResourceProperties.BucketName;
  const objectKey: string = event.ResourceProperties.ObjectKey;
  const contentType: string = event.ResourceProperties.ContentType;
  const fileContent: string = event.ResourceProperties.FileContent;

  await s3
    .putObject({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
      Body: fileContent,
    })
    .promise();

  return "Success";
};
