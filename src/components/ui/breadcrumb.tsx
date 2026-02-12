import * as React from "react"
import { ChevronLeft, MoreHorizontal } from "lucide-react"

const Breadcrumb = React.forwardRef<
    HTMLElement,
    React.ComponentPropsWithoutRef<"nav"> & {
        separator?: React.ReactNode
    }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
    HTMLOListElement,
    React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
    <ol
        ref={ref}
        className={`flex flex-wrap items-center gap-1.5 break-words text-sm text-black/40 ${className || ""}`}
        {...props}
    />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
    HTMLLIElement,
    React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
    <li
        ref={ref}
        className={`inline-flex items-center gap-1.5 ${className || ""}`}
        {...props}
    />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
    HTMLAnchorElement,
    React.ComponentPropsWithoutRef<"a">
>(({ className, ...props }, ref) => {
    return (
        <a
            ref={ref}
            className={`transition-colors hover:text-black ${className || ""}`}
            {...props}
        />
    )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
    HTMLSpanElement,
    React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
    <span
        ref={ref}
        role="link"
        aria-disabled="true"
        aria-current="page"
        className={`font-normal text-black ${className || ""}`}
        {...props}
    />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
    children,
    className,
    ...props
}: React.ComponentProps<"li">) => (
    <li
        role="presentation"
        aria-hidden="true"
        className={`[&>svg]:size-3.5 ${className || ""}`}
        {...props}
    >
        {children ?? <ChevronLeft />}
    </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
    className,
    ...props
}: React.ComponentProps<"span">) => (
    <span
        role="presentation"
        aria-hidden="true"
        className={`flex h-9 w-9 items-center justify-center ${className || ""}`}
        {...props}
    >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">More</span>
    </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

export {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
}
