-- Add public INSERT policy for marketing-inspiration bucket (for anonymous banner uploads)
CREATE POLICY "Allow public uploads to marketing-inspiration"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'marketing-inspiration');

-- Add public UPDATE policy for marketing-inspiration bucket (for upsert operations)
CREATE POLICY "Allow public updates to marketing-inspiration"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'marketing-inspiration');