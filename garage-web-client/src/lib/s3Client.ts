import { S3Client } from "@aws-sdk/client-s3";

export function getS3Client(config: {
  s3Endpoint: string;
  s3AccessKey: string;
  s3SecretKey: string;
}) {
  return new S3Client({
    endpoint: config.s3Endpoint,
    credentials: {
      accessKeyId: config.s3AccessKey,
      secretAccessKey: config.s3SecretKey,
    },
    region: "garage", // Garage doesn't care much about region, but SDK requires one
    forcePathStyle: true, // Required for S3 compatible backends like Garage/MinIO
  });
}
