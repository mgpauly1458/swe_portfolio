import uncurl
from amazon_web_scraping.amazon_scraper import AmazonWebDriver, AmazonProduct

curl_file = 'amazonSearch'
with open(curl_file, 'r') as f:
    curl_command = f.read()
    context = uncurl.parse_context(curl_command)

driver = AmazonWebDriver(curl_command)
results = driver.search_for_product('laptop')

for product in results:
    print(f"Title: {product.title}")
    print(f"Image URL: {product.image_url}")
    print(f"Price: {product.price}")
    product.save_product()