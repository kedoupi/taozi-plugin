---
name: django-patterns
description: Django 开发模式参考 — Models、Views、URL、Middleware、DRF、Celery 异步任务。
---

# Django 开发模式参考

Django 全栈开发核心模式和最佳实践。

## Model 设计 (Fat Models)

```python
from django.db import models

class TimestampMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Order(TimestampMixin):
    STATUS_CHOICES = [("pending", "待处理"), ("paid", "已支付"), ("shipped", "已发货")]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    total = models.DecimalField(max_digits=10, decimal_places=2)

    # 业务逻辑放 Model，不放 View
    def mark_paid(self) -> None:
        if self.status != "pending":
            raise ValueError("只有待处理订单可以标记为已支付")
        self.status = "paid"
        self.save(update_fields=["status", "updated_at"])
```

原则: Model 包含数据 + 业务逻辑 | View 只做请求/响应编排 | 避免 "贫血模型"

## CBV vs FBV

```python
# FBV: 简单逻辑优先
@login_required
def order_detail(request, pk):
    order = get_object_or_404(Order, pk=pk, user=request.user)
    return render(request, "orders/detail.html", {"order": order})

# CBV: 复用逻辑、CRUD 操作
class OrderListView(LoginRequiredMixin, ListView):
    model = Order
    context_object_name = "orders"
    template_name = "orders/list.html"

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).select_related("user")
```

选择: 简单用 FBV | 通用 CRUD 用 CBV/Generic | API 用 DRF ViewSet

## URL 命名

```python
# urls.py - 始终使用 name= 和 app_name
app_name = "orders"

urlpatterns = [
    path("", views.OrderListView.as_view(), name="list"),
    path("<int:pk>/", views.order_detail, name="detail"),
    path("create/", views.OrderCreateView.as_view(), name="create"),
]

# 模板中用 url 标签
# <a href="{% url 'orders:detail' order.pk %}">查看订单</a>
```

## Middleware 链

```python
# 自定义 Middleware
class RequestTimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        duration = time.monotonic() - start
        response["X-Request-Duration"] = f"{duration:.3f}s"
        return response

# settings.py 中顺序很重要: 请求从上到下，响应从下到上
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "myapp.middleware.RequestTimingMiddleware",  # 放在靠前位置
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
]
```

## DRF Serializers / ViewSets

```python
from rest_framework import serializers, viewsets, permissions

class OrderSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Order
        fields = ["id", "user", "user_email", "status", "total", "created_at"]
        read_only_fields = ["id", "user", "created_at"]

    def validate_total(self, value):
        if value <= 0:
            raise serializers.ValidationError("金额必须大于 0")
        return value

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).select_related("user")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
```

## Django ORM 优化

```python
# N+1 问题的解决方案
# 错误: N+1 查询
for order in Order.objects.all():
    print(order.user.email)  # 每次循环都查一次 user

# 正确: select_related (ForeignKey / OneToOne)
orders = Order.objects.select_related("user").all()

# 正确: prefetch_related (ManyToMany / 反向 ForeignKey)
users = User.objects.prefetch_related("orders").all()

# 只查需要的字段
orders = Order.objects.only("id", "status", "total")

# 批量操作
Order.objects.filter(status="pending").update(status="cancelled")
Order.objects.bulk_create([Order(user=u, total=100) for u in users])
```

## Migrations 最佳实践

```bash
# 生成迁移
python manage.py makemigrations
python manage.py migrate

# 查看迁移 SQL（不执行）
python manage.py sqlmigrate orders 0004

# 回滚到指定版本
python manage.py migrate orders 0003
```

原则: 每次只改一个 Model | 迁移文件提交到版本控制 | 数据迁移和 Schema 迁移分开 | 生产环境禁止自动 migrate

## Celery 异步任务

```python
# tasks.py
from celery import shared_task

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation(self, order_id: int):
    try:
        order = Order.objects.select_related("user").get(pk=order_id)
        send_email(to=order.user.email, subject=f"订单 {order.id} 已确认")
    except Exception as exc:
        self.retry(exc=exc)

# 调用
order.mark_paid()
send_order_confirmation.delay(order.id)  # 异步执行
```

## Caching (Redis)

```python
from django.core.cache import cache

# 基本缓存
def get_user_profile(user_id: int):
    key = f"user:profile:{user_id}"
    profile = cache.get(key)
    if profile is None:
        profile = UserProfile.objects.get(user_id=user_id)
        cache.set(key, profile, timeout=300)  # 5 分钟
    return profile

# 视图缓存
from django.views.decorators.cache import cache_page

@cache_page(60 * 5)  # 5 分钟
def product_list(request):
    products = Product.objects.all()
    return render(request, "products/list.html", {"products": products})
```

## Settings 分层

```python
# settings/base.py - 公共配置
DEBUG = False
INSTALLED_APPS = [...]

# settings/dev.py
from .base import *
DEBUG = True

# settings/prod.py
from .base import *
ALLOWED_HOSTS = ["example.com"]
DATABASES = {"default": env.db()}

# 启动: DJANGO_SETTINGS_MODULE=myproject.settings.prod python manage.py runserver
```
